// import { NextRequest, NextResponse } from "next/server";

// const ANALYTICS_ENDPOINT = process.env.NODE_ENV === 'production'
//   ? 'https://your-next-app.vercel.app/api/trackAnalytics'
//   : 'http://localhost:3000/api/trackAnalytics';

// export async function middleware(req: NextRequest) {
//   // Get geo and IP using request headers (since NextRequest doesn't expose geo and ip directly)
//   const geo = {
//     city: req.headers.get('x-vercel-ip-city') || 'unknown',
//     country: req.headers.get('x-vercel-ip-country') || 'unknown',
//     region: req.headers.get('x-vercel-ip-region') || 'unknown',
//   };
//   const ip = req.headers.get('x-forwarded-for') || 'unknown';
//   const userAgent = req.headers.get('user-agent');
//   const connection = req.headers.get('sec-ch-ua-platform') || 'unknown';
//   const timestamp = new Date().toISOString();

//   await fetch(ANALYTICS_ENDPOINT, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ geo, userAgent, connection, ip, timestamp }),
//   });

//   return NextResponse.next();
// }


// Updated Middleware and Database Debugging for Prisma Analytics
// Prisma Analytics Middleware with Proper Import

// import { PrismaClient } from '@prisma/client';
// import { NextRequest, NextResponse } from 'next/server';

// const prisma = new PrismaClient();

// export async function middleware(req: NextRequest) {
//   // if (req.method !== 'POST') {
//   //   console.warn('Invalid request method:', req.method);
//   //   return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
//   // }

//   try {
//     const body = await req.json();
//     console.log('Received payload:', body);

//     // Validate payload structure
//     if (!body.geo || !body.ip || !body.timestamp) {
//       console.warn('Invalid payload structure:', body);
//       return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
//     }

//     const result = await prisma.trafficSource.create({
//       data: body,
//     });
//     console.log('Database insert successful:', result);

//     // Retrieve and log all records for debugging
//     const allRecords = await prisma.trafficSource.findMany();
//     console.log('Current Database Records:', allRecords);

//     return NextResponse.json(result, { status: 201 });
//   } catch (error) {
//     console.error('Middleware processing error:', error);
//     return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
//   }
// }



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

// const ANALYTICS_ENDPOINT = `${baseUrl}/api/trackAnalytics`;
// const endpoints = [
//   // `${baseUrl}/api/averageMetrics`,
//   `${baseUrl}/api/locationMetrics`,
//   `${baseUrl}/api/referralMetrics`,
//   `${baseUrl}/api/trafficSources`,
//   `${baseUrl}/api/sessionMetrics`,
//   `${baseUrl}/api/deviceMetrics`
// ];

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

  // const timestamp = new Date();
  // const commonData = {
  //   timestamp,
  //   hour: timestamp.getHours(),
  //   dayOfWeek: timestamp.getDay(),
  //   networkSpeed: parseFloat(req.headers.get('downlink') || '0'),
  //   deviceType: req.headers.get('sec-ch-ua-platform') || 'unknown',
  //   browser: req.headers.get('user-agent')?.split(' ')[0] || 'unknown',
  //   connectionType: req.headers.get('ect') || 'unknown'
  // };
  // const endpointsWithData = [
  //   { url: `${baseUrl}/api/averageMetrics`, data: { ...commonData, averageVisits: 1 } },
  //   { url: `${baseUrl}/api/locationMetrics`, data: { ...commonData, country: req.headers.get('x-vercel-ip-country') || 'unknown', region: req.headers.get('x-vercel-ip-region') || 'unknown', city: req.headers.get('x-vercel-ip-city') || 'unknown', visitCount: 1 } },
  //   { url: `${baseUrl}/api/referralMetrics`, data: { ...commonData, source: req.headers.get('referer') || 'direct', visitCount: 1 } },
  //   { url: `${baseUrl}/api/trafficSources`, data: { ...commonData, sourceName: req.headers.get('referer') || 'direct', visitCount: 1 } },
  //   { url: `${baseUrl}/api/sessionMetrics`, data: { ...commonData, duration: 0 } },
  //   { url: `${baseUrl}/api/deviceMetrics`, data: { ...commonData, deviceType: commonData.deviceType, percentage: 0 } }
  // ];


  const geo = {
    city: req.headers.get('x-vercel-ip-city') || 'unknown',
    country: req.headers.get('x-vercel-ip-country') || 'unknown',
    region: req.headers.get('x-vercel-ip-region') || 'unknown'
  };

  // const metrics = {
  //   timestamp: new Date().toISOString(),
  //   hour: new Date().getHours(),
  //   dayOfWeek: new Date().getDay(),
  //   averageVisits: 1,
  //   averageSessionDuration: Math.random() * 10,
  //   averageNetworkSpeed: parseFloat(req.headers.get('downlink') || '0'),
  //   deviceType: req.headers.get('sec-ch-ua-platform') || 'unknown',
  //   browser: req.headers.get('user-agent')?.split(' ')[0] || 'unknown',
  //   browserCount: 1,
  //   connectionType: req.headers.get('ect') || 'unknown'
  // };

  // console.log("metrics", metrics, ANALYTICS_ENDPOINT);
  

  // try {
  //   // const response = await fetch(ANALYTICS_ENDPOINT, {
  //   //   method: 'POST',
  //   //   headers: { 'Content-Type': 'application/json' },
  //   //   body: JSON.stringify(metrics),
  //   // });
  //   console.log('POST Response status:', response.status);
  //   if (!response.ok) {
  //     console.error('Failed to send analytics:', response.statusText);
  //   }
  // } catch (err) {
  //   console.error('POST Failed to send analytics:', err);
  // }
  // const geo = {
  //   city: req.geo?.city || 'unknown',
  //   country: req.geo?.country || 'unknown',
  //   region: req.geo?.region || 'unknown',
  // };
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
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

export const config = { matcher: '/((?!_next|api|favicon.ico).*)' }; // Exclude Next.js internals and ensure all other paths trigger middleware