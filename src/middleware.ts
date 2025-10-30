import { NextRequest, NextResponse } from 'next/server';

// Get base URL from environment variable or infer from request
function getBaseUrl(req: NextRequest): string {
  // Use environment variable if set (production)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // Fallback: construct from request (works in production on Vercel)
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}

export async function middleware(req: NextRequest) {
  // Skip analytics tracking if disabled
  if (process.env.DISABLE_ANALYTICS_TRACKING === 'true') {
    return NextResponse.next();
  }

  const baseUrl = getBaseUrl(req);
  const TRACK_ANALYTICS_ENDPOINT = `${baseUrl}/api/trackAnalytics`;
  
  // Don't log in production to reduce noise
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware triggered:', req.method, req.url);
  }

  const geo = {
    city: req.headers.get('x-vercel-ip-city') || 'unknown',
    country: req.headers.get('x-vercel-ip-country') || 'unknown',
    region: req.headers.get('x-vercel-ip-region') || 'unknown'
  };

  const userAgent = req.headers.get('user-agent') || 'unknown';
  const connectionType = req.headers.get('sec-ch-ua-platform') || 'unknown';
  const timestamp = new Date();

  const commonData = {
    timestamp,
    hour: timestamp.getHours(),
    dayOfWeek: timestamp.getDay(),
    averageVisits: 1,
    averageSessionDuration: Math.random() * 10 + 1,
    averageNetworkSpeed: Math.random() * 100,
    deviceType: /mobile/i.test(userAgent) ? 'mobile' : 'desktop',
    browser: userAgent.split(' ')[0],
    browserCount: 1,
    connectionType,
  };

  const locationData = { country: geo.country, region: geo.region, city: geo.city, visitCount: 1 };
  const referralData = { source: req.headers.get('referer') || 'direct', visitCount: 1 };
  const trafficData = { sourceName: req.headers.get('referer') || 'direct', visitCount: 1 };

  const payloads = [
    { type: 'average', payload: commonData },
    { type: 'location', payload: locationData },
    { type: 'referral', payload: referralData },
    { type: 'traffic', payload: trafficData },
  ];

  // Fire and forget - don't block response on analytics
  // Analytics tracking should never slow down page loads
  Promise.all(
    payloads.map(data =>
      fetch(TRACK_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(err => {
        // Silent fail in production, log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error posting analytics data:', err);
        }
      })
    )
  ).catch(() => {
      // Ignore all errors - analytics should never affect user experience
  });

  return NextResponse.next();
}

export const config = { matcher: '/((?!_next|api|favicon.ico).*)' };
