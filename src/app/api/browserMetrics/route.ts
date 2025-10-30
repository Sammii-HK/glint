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

    // Aggregate by browser
    const browserData = metrics.reduce((acc, metric) => {
      const browser = metric.browser || 'unknown';
      const existing = acc.find(b => b.browser === browser);
      if (existing) {
        existing.count += metric.browserCount || 1;
      } else {
        acc.push({ browser, count: metric.browserCount || 1 });
      }
      return acc;
    }, [] as { browser: string; count: number }[]);

    const sorted = browserData.sort((a, b) => b.count - a.count);

    return NextResponse.json(sorted, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching browser metrics:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
  }
}

