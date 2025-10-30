# Populating Glint Analytics with Data

Three ways to fill your dashboard with analytics data:

## Option 1: Local Data Generator Script ⚡

Quick way to generate test data locally:

```bash
# Generate 50 events (default)
npm run generate-data

# Generate custom amount
npx ts-node scripts/generate-data.ts 100

# Target remote API
GLINT_API_URL=https://your-app.vercel.app/api/trackAnalytics npm run generate-data
```

**What it does:**
- Sends location, referral, and traffic source analytics
- Uses realistic variety (multiple countries, cities, referrers)
- Adds small delays to avoid overwhelming API
- Shows success/failure for each batch

## Option 2: Cloudflare Worker 🌍 (Recommended!)

Deploy a Cloudflare Worker to continuously hit your API from different edge locations worldwide.

### Setup

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login:**
   ```bash
   wrangler login
   ```

3. **Set your API URL:**
   ```bash
   cd cloudflare-worker
   wrangler secret put GLINT_API_URL
   # Enter: https://your-app.vercel.app/api/trackAnalytics
   ```

4. **Deploy:**
   ```bash
   wrangler deploy
   ```

### How It Works

- Runs on cron schedule (every minute by default)
- Hits API from Cloudflare's global edge network
- Simulates traffic from different regions
- Can also be triggered manually via HTTP

### Manual Trigger

```bash
curl https://glint-analytics-pump.your-subdomain.workers.dev
```

### Adjust Frequency

Edit `cloudflare-worker/wrangler.toml`:
- Every minute: `*/1 * * * *`
- Every 5 minutes: `*/5 * * * *`
- Every hour: `0 * * * *`

See `cloudflare-worker/README.md` for full details.

## Option 3: Just Browse Your Site 🖱️

The middleware automatically tracks every page visit:

1. Start dev server: `npm run dev`
2. Visit `http://localhost:3000`
3. Visit different routes (create more pages)
4. Each visit auto-tracks analytics
5. Refresh dashboard to see data

**Note:** For production, you'll get real geo-location from Vercel headers.

## Testing the API Directly

You can also hit the API with curl:

```bash
# Track location
curl -X POST http://localhost:3000/api/trackAnalytics \
  -H "Content-Type: application/json" \
  -d '{
    "type": "location",
    "payload": {
      "country": "US",
      "region": "California",
      "city": "San Francisco",
      "visitCount": 5
    }
  }'

# Track referral
curl -X POST http://localhost:3000/api/trackAnalytics \
  -H "Content-Type: application/json" \
  -d '{
    "type": "referral",
    "payload": {
      "source": "google.com",
      "visitCount": 10
    }
  }'

# Track traffic source
curl -X POST http://localhost:3000/api/trackAnalytics \
  -H "Content-Type: application/json" \
  -d '{
    "type": "traffic",
    "payload": {
      "sourceName": "twitter.com",
      "visitCount": 8
    }
  }'
```

## Expected Data Format

All analytics go through `/api/trackAnalytics` with this structure:

```typescript
{
  type: "location" | "referral" | "traffic" | "average",
  payload: {
    // For location:
    country: string,
    region: string,
    city: string,
    visitCount: number

    // For referral:
    source: string,
    visitCount: number

    // For traffic:
    sourceName: string,
    visitCount: number
  }
}
```

## Monitoring

Check your database to verify data:
```bash
# Using Prisma Studio
npx prisma studio

# Or direct SQL
# SELECT * FROM "LocationMetrics" LIMIT 10;
# SELECT * FROM "ReferralMetrics" LIMIT 10;
# SELECT * FROM "TrafficSource" LIMIT 10;
```

## Rate Limiting

- Local script: 100ms delay between batches
- Cloudflare Worker: Configurable via cron schedule
- Middleware: No rate limiting (tracks every visit)

For production, consider adding rate limiting to prevent abuse.

