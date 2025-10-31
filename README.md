# Glint Analytics

Custom analytics platform built on Next.js Edge Middleware for zero-latency tracking and PostgreSQL for persistence. Deployed on Vercel with full control over data and infrastructure.

<img width="1708" height="980" alt="Screenshot 2025-10-31 at 13 40 16" src="https://github.com/user-attachments/assets/85f2bf4d-811b-4fc9-a96f-109f8ec2a84e" />

## Architecture

**Edge-First Tracking**: Analytics collection runs on Vercel's Edge Network (300+ locations) via Next.js middleware, executing before requests hit the Node.js runtime. This achieves sub-50ms latency and eliminates cold starts.

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
**Database**: Connection pooling via Prisma singleton pattern  
**Queries**: Ordered by timestamp desc with limits on high-cardinality endpoints  
**Non-blocking**: Analytics tracking can fail without impacting page loads

## Production Considerations

- **CORS**: Configurable via `ALLOWED_ORIGINS` env var, defaults to `*`
- **Logging**: Conditional based on `NODE_ENV` (verbose in dev, minimal in prod)
- **Validation**: Request validation prevents invalid data insertion
- **Connection Management**: Prisma singleton prevents serverless connection pool exhaustion
- **Environment Variables**: `NEXT_PUBLIC_APP_URL` for production URL resolution

## Stack

- **Runtime**: Next.js 15 (App Router)
- **Edge**: Vercel Edge Network
- **Database**: PostgreSQL via Prisma ORM
- **Charts**: Recharts
- **TypeScript**: Strict mode
- **Deployment**: Vercel (serverless functions + edge)

## Data Population

Optional Cloudflare Worker runs every 10 minutes via cron to populate test data from edge locations worldwide. Worker sends batched analytics events to simulate realistic traffic patterns.
