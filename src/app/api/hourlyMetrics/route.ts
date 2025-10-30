import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { corsHeaders } from '@/utils/cors';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const metrics = await prisma.averageMetrics.findMany({
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    // Aggregate by hour
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      visits: 0,
    }));

    metrics.forEach(metric => {
      hourlyData[metric.hour].visits += metric.averageVisits || 1;
    });

    return NextResponse.json(hourlyData, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching hourly metrics:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

