import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

// export async function GET() {
//   const data = await prisma.deviceMetrics.findMany();
//   return NextResponse.json(data.map(d => ({ label: d.deviceType, value: d.percentage })));
// }
import { corsHeaders } from '@/utils/cors';

export async function OPTIONS() {
  return corsHeaders;
}

// TODO UPDATE


export async function GET() {
  try {
    const data = await prisma.deviceMetrics.findMany();
    return NextResponse.json(data.map(d => ({ label: d.deviceType, value: d.percentage })));
  } catch (error) {
    console.error('❌ Error in deviceMetrics API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("deviceMetrics POST req", req);
  
  try {
    const body = await req.json();
    console.log('POST /deviceMetrics with:', body);
    
    const created = await prisma.deviceMetrics.create({
      data: {
        // timestamp: new Date(),
        deviceType: body.deviceType,
        percentage: body.percentage,
      }
    });
    console.log('Saved deviceMetrics:', created);

    return NextResponse.json(created, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('POST error:', error);
    return new NextResponse('POST failed', { status: 500 });
  }
}
