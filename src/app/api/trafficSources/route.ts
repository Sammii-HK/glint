import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { corsHeadersGet} from '@/utils/cors';

const prisma = new PrismaClient();

type TrafficSource = {
  label: string;
  value: number;
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeadersGet() });
}

export async function GET() {
  try {
    const trafficSources = await prisma.trafficSource.findMany();
    const formattedData: TrafficSource[] = trafficSources.map(source => ({
      label: source.sourceName,
      value: source.visitCount,
    }));
    const headers = corsHeadersGet();
    return NextResponse.json(formattedData, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
