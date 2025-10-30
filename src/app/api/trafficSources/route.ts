import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders, corsHeadersGet} from '@/utils/cors';
import { prisma } from '@/lib/prisma';

export type TrafficSource = {
  label: string;
  value: number;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const trafficSources = await prisma.trafficSource.findMany();
    console.log('GET /trafficSources called');
    const formattedData: TrafficSource[] = trafficSources.map(source => ({
      label: source.sourceName,
      value: source.visitCount,
    }));
    const headers = corsHeadersGet();
    return NextResponse.json(formattedData, { status: 200, headers });
  } catch (error) {
    console.log("GET error", error);
    
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received analytics payload:', body);

    if (!body.geo || !body.ip || !body.timestamp) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    const createdEntry = await prisma.trafficSource.create({
      data: body,
    });
    console.log('Data inserted to trafficSource:', createdEntry);

    return new NextResponse(JSON.stringify(createdEntry), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error inserting trafficSource data:', error);
    return new NextResponse('Failed to save analytics', { status: 500 });
  }
};

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    console.log('PUT /trafficSources with:', body);

    const updated = await prisma.trafficSource.update({
      where: { id },
      data,
    });
    console.log('Updated trafficSources:', updated);

    return NextResponse.json(updated, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('PUT error:', error);
    return new NextResponse('PUT failed', { status: 500 });
  }
};
