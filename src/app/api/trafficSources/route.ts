import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { headerOrigin, optionsHandler } from '@/utils/cors';

const prisma = new PrismaClient();

type TrafficSource = {
  label: string;
  value: number;
};

export async function OPTIONS() {
  return optionsHandler();
}

export async function GET() {
  try {
    const trafficSources = await prisma.trafficSource.findMany();
    const formattedData: TrafficSource[] = trafficSources.map(source => ({
      label: source.sourceName,
      value: source.visitCount,
    }));

    if (!formattedData.length) {
      return NextResponse.json({ error: 'No traffic source data found' }, { status: 404 });
    }
    return NextResponse.json(formattedData, { status: 200, headers: headerOrigin });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
