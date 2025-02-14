import { PrismaClient, Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

type AnalyticsType = 'average' | 'location' | 'referral' | 'traffic';

type AverageMetricsInput = Prisma.AverageMetricsCreateInput;
type LocationMetricsInput = Prisma.LocationMetricsCreateInput;
type ReferralMetricsInput = Prisma.ReferralMetricsCreateInput;
type TrafficSourceInput = Prisma.TrafficSourceCreateInput;

type TrackRequestBody = {
  type: AnalyticsType;
  payload: AverageMetricsInput | LocationMetricsInput | ReferralMetricsInput | TrafficSourceInput;
};
import { headerOrigin, optionsHandler } from '@/utils/cors';

export async function OPTIONS() {
  return optionsHandler();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackRequestBody;
    const { type, payload } = body;
    let result;
    console.log('📊 Incoming Analytics:', JSON.stringify(body));

    switch (type) {
      case 'average':
        result = await prisma.averageMetrics.create({ data: payload as AverageMetricsInput });
        break;
      case 'location':
        result = await prisma.locationMetrics.create({ data: payload as LocationMetricsInput });
        break;
      case 'referral':
        result = await prisma.referralMetrics.create({ data: payload as ReferralMetricsInput });
        break;
      case 'traffic':
        result = await prisma.trafficSource.create({ data: payload as TrafficSourceInput });
        break;
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }
    console.log('✅ Analytics Recorded:', result);

    return NextResponse.json(result, { status: 201, headers: headerOrigin });
  } catch (error) {
    console.error('❌ Error in trackAnalytics:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}


// - Add headers to requests using a proxy or custom headers for local geo/ip testing.