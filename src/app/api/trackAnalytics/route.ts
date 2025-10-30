import { corsHeaders } from '@/utils/cors';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type AnalyticsType = 'average' | 'location' | 'referral' | 'traffic';

type AverageMetricsInput = Prisma.AverageMetricsCreateInput;
type LocationMetricsInput = Prisma.LocationMetricsCreateInput;
type ReferralMetricsInput = Prisma.ReferralMetricsCreateInput;
type TrafficSourceInput = Prisma.TrafficSourceCreateInput;

type TrackRequestBody = {
  type: AnalyticsType;
  payload: AverageMetricsInput | LocationMetricsInput | ReferralMetricsInput | TrafficSourceInput;
};
// import { headerOrigin, optionsHandler } from '@/utils/cors';

export async function OPTIONS() {
  return corsHeaders;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TrackRequestBody;
    const { type, payload } = body;

    // Validate request
    if (!type || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: type and payload' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate analytics type
    const validTypes: AnalyticsType[] = ['average', 'location', 'referral', 'traffic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid analytics type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    let result;

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Incoming Analytics:', JSON.stringify(body));
    }

    try {
      switch (type) {
        case 'average':
          result = await prisma.averageMetrics.create({ data: payload as AverageMetricsInput });
          break;
        case 'location':
          // Validate location payload
          const locationPayload = payload as LocationMetricsInput;
          if (!locationPayload.country || !locationPayload.city) {
            return NextResponse.json(
              { error: 'Location payload must include country and city' },
              { status: 400, headers: corsHeaders }
            );
          }
          result = await prisma.locationMetrics.create({ data: locationPayload });
          break;
        case 'referral':
          // Validate referral payload
          const referralPayload = payload as ReferralMetricsInput;
          if (!referralPayload.source) {
            return NextResponse.json(
              { error: 'Referral payload must include source' },
              { status: 400, headers: corsHeaders }
            );
          }
          result = await prisma.referralMetrics.create({ data: referralPayload });
          break;
        case 'traffic':
          // Validate traffic payload
          const trafficPayload = payload as TrafficSourceInput;
          if (!trafficPayload.sourceName) {
            return NextResponse.json(
              { error: 'Traffic payload must include sourceName' },
              { status: 400, headers: corsHeaders }
            );
          }
          result = await prisma.trafficSource.create({ data: trafficPayload });
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid analytics type' },
            { status: 400, headers: corsHeaders }
          );
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Analytics Recorded:', result);
      }

      return NextResponse.json(result, { status: 201, headers: corsHeaders });
    } catch (dbError: any) {
      // Handle Prisma-specific errors
      if (dbError.code === 'P2002') {
        // Unique constraint violation - could happen if same data inserted twice
        // In production, might want to update instead of create
        return NextResponse.json(
          { error: 'Duplicate entry', code: dbError.code },
          { status: 409, headers: corsHeaders }
        );
      }

      throw dbError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Only log full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error in trackAnalytics:', error);
    } else {
      // Log sanitized error in production
      console.error('❌ Error in trackAnalytics:', errorMessage);
    }

    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Internal server error' : errorMessage },
      { status: 500, headers: corsHeaders }
    );
  }
}


// - Add headers to requests using a proxy or custom headers for local geo/ip testing.