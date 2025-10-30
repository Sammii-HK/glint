import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/utils/cors';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const locationMetrics = await prisma.locationMetrics.findMany({
      orderBy: { timestamp: 'desc' },
    });
    
    // Return empty array instead of 404
    if (!locationMetrics.length) {
      return NextResponse.json([], { status: 200, headers: corsHeaders });
    }
    
    return NextResponse.json(locationMetrics, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching location metrics:', error);
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("locationMetrics POST req", req);

  try {
    const body = await req.json();
    console.log('POST /locationMetrics with:', body);

    const created = await prisma.locationMetrics.create({
      data: {
        timestamp: new Date(),
        country: body.country,
        region: body.region,
        city: body.city,
        visitCount: body.visitCount || body.visits || 1,
      }
    });
    console.log('Saved locationMetrics:', created);

    return NextResponse.json(created, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST error:', error);
    return new NextResponse('POST failed', { status: 500 });
  }
}
