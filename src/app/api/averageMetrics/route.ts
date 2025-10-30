import { corsHeaders, corsHeadersGet } from './../../../utils/cors';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const averageMetrics = await prisma.averageMetrics.findMany();
    const headers = corsHeaders;

    console.log("averageMetrics", averageMetrics);
    

    // if (!averageMetrics.length) {
    //   return NextResponse.json({ error: 'No average metrics found' }, { status: 404, headers });
    // }
    return NextResponse.json(averageMetrics, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500, headers: corsHeadersGet() });
  }
}

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  console.log("averageMetrics POST req", req);
  

  try {
    const body = await req.json();
    console.log('POST /averageMetrics with:', body);
    

    const created = await prisma.averageMetrics.create({
      data: {
        timestamp: new Date(),
        hour: body.hour,
        dayOfWeek: body.dayOfWeek,
        averageVisits: body.averageVisits,
        averageSessionDuration: body.averageSessionDuration,
        averageNetworkSpeed: body.averageNetworkSpeed,
        deviceType: body.deviceType,
        browser: body.browser,
        browserCount: body.browserCount,
        connectionType: body.connectionType,
      }
    });
    console.log('Saved averageMetrics:', created);

    return NextResponse.json(created, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST error:', error);
    return new NextResponse('POST failed', { status: 500 });
  }
}
