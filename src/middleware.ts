import { NextRequest, NextResponse } from "next/server";
import { safeFetch } from "./utils/safeFetch";

const ANALYTICS_ENDPOINT = process.env.NODE_ENV === 'production'
  ? 'https://your-next-app.vercel.app/api/trackAnalytics'
  : 'http://localhost:3000/api/trackAnalytics';

export async function middleware(req: NextRequest) {
  // Get geo and IP using request headers (since NextRequest doesn't expose geo and ip directly)
  const geo = {
    city: req.headers.get('x-vercel-ip-city') || 'unknown',
    country: req.headers.get('x-vercel-ip-country') || 'unknown',
    region: req.headers.get('x-vercel-ip-region') || 'unknown',
  };
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent');
  const connection = req.headers.get('sec-ch-ua-platform') || 'unknown';
  const timestamp = new Date().toISOString();

  await safeFetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geo, userAgent, connection, ip, timestamp }),
  });

  return NextResponse.next();
}
