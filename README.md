# Glint Analytics

Custom analytics platform built on Next.js Edge Middleware for zero-latency tracking and PostgreSQL for persistence. Self-populating dashboard via Cloudflare Worker cron job that simulates traffic from global edge locations.

<img width="1708" height="980" alt="Screenshot 2025-10-31 at 13 40 16" src="https://github.com/user-attachments/assets/85f2bf4d-811b-4fc9-a96f-109f8ec2a84e" />

## Architecture

**Edge-First Tracking**: Analytics collection runs on Vercel's Edge Network via Next.js middleware, executing before requests hit the Node.js runtime. This achieves sub-50ms latency and eliminates cold starts.

**Data Flow**: Request → Edge Middleware → API Route (`/api/trackAnalytics`) → PostgreSQL

Middleware extracts geo-location headers (`x-vercel-ip-country`, `x-vercel-ip-region`, `x-vercel-ip-city`), user-agent, and referrer, then dispatches analytics payloads asynchronously to avoid blocking response delivery.

## Implementation

### Edge Middleware

```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const geo = {
    city: req.headers.get('x-vercel-ip-city') || 'unknown',
    country: req.headers.get('x-vercel-ip-country') || 'unknown',
    region: req.headers.get('x-vercel-ip-region') || 'unknown'
  };

  const payloads = [
    { type: 'location', payload: locationData },
    { type: 'referral', payload: referralData },
    { type: 'traffic', payload: trafficData },
  ];

  // Fire-and-forget: analytics never blocks page loads
  Promise.all(payloads.map(data => fetch(TRACK_ANALYTICS_ENDPOINT, {...})));
  return NextResponse.next();
}
```

**Key Design Decisions**:
- Non-blocking: Analytics failures don't affect user experience
- Edge runtime limitations: Can't access Prisma directly, so we call API routes
- Header-based geo: Uses Vercel's automatic geo-headers instead of IP lookups
- Environment-aware: URL resolution via env vars or request headers

### Database Layer

Prisma ORM with singleton pattern to prevent connection exhaustion in serverless:

```typescript
// src/lib/prisma.ts
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Schema Design**: Denormalized time-series data with separate models for location, referral, traffic, and average metrics. Trade-off: slightly more storage for simpler queries and better read performance.

### API Routes

Unified `/api/trackAnalytics` endpoint accepts typed payloads:

```typescript
type TrackRequestBody = {
  type: 'average' | 'location' | 'referral' | 'traffic';
  payload: AverageMetricsInput | LocationMetricsInput | ...;
};
```

GET endpoints aggregate and format data for consumption:
- `/api/trafficSources`: Aggregates by `sourceName`, sums `visitCount`
- `/api/referralMetrics`: Returns raw records (frontend aggregates)
- `/api/averageMetrics`: Limits to last 100 records for performance

**Error Handling**: Returns empty arrays instead of 404s to prevent chart rendering failures. Validation includes required field checks and Prisma-specific error handling (P2002 for duplicates).

## Performance

**Edge Middleware**: Sub-50ms execution, runs globally, zero cold starts  
**Database**: Connection pooling via Prisma singleton pattern to prevent serverless connection exhaustion  
**Queries**: Ordered by timestamp desc with limits on high-cardinality endpoints  
**Non-blocking**: Analytics tracking can fail without impacting page loads

## Stack

- **Runtime**: Next.js 15 (App Router)
- **Edge**: Vercel Edge Network
- **Database**: PostgreSQL via Prisma ORM
- **Charts**: Recharts
- **TypeScript**: Strict mode
- **Deployment**: Vercel (serverless functions + edge)

## Self-Populating Dashboard with Cloudflare Worker

The dashboard automatically populates with test data using a Cloudflare Worker deployed via Wrangler CLI. Worker runs on a cron schedule (every 10 minutes) and sends batched analytics events (location, referral, traffic source) from global edge locations to simulate realistic traffic patterns.
