import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/utils/cors';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const referralMetrics = await prisma.referralMetrics.findMany({
      orderBy: { timestamp: 'desc' },
    });
    
    // Return empty array instead of 404 - better for charts
    if (!referralMetrics.length) {
      return NextResponse.json([], { status: 200, headers: corsHeaders });
    }
    
    return NextResponse.json(referralMetrics, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching referral metrics:', error);
    return NextResponse.json(
      { error: (error as Error).message }, 
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("referralMetrics POST req", req);

  try {
    const body = await req.json();
    console.log('POST /referralMetrics with:', body);

    const created = await prisma.referralMetrics.create({
      data: {
        timestamp: new Date(),
        source: body.source,
        visitCount: body.visitCount || body.visits || 1,
      }
    });
    console.log('Saved referralMetrics:', created);

    return NextResponse.json(created, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST error:', error);
    return new NextResponse('POST failed', { status: 500 });
  }
}
