# Cloudflare Worker - Glint Analytics Data Pump

This Cloudflare Worker continuously hits your Glint Analytics API to populate it with test data from edge locations worldwide.

## Features

- 🌍 Hits API from Cloudflare's global edge network (simulates different regions)
- ⏰ Runs automatically on a cron schedule (every 10 minutes by default)
- 🔄 Can also be triggered manually via HTTP request
- 📊 Sends location, referral, and traffic source analytics

## Setup

### Option 1: Deploy via Wrangler CLI

1. Install Wrangler:

```bash
npm install -g wrangler
# or
npm install wrangler --save-dev
```

2. Login to Cloudflare:

```bash
wrangler login
```

3. Set your API URL as a secret:

```bash
wrangler secret put GLINT_API_URL
# When prompted, enter: https://your-app.vercel.app/api/trackAnalytics
```

4. Deploy:

```bash
wrangler deploy
```

### Option 2: Deploy via Cloudflare Dashboard

1. Go to [Cloudflare Workers & Pages](https://workers.cloudflare.com)
2. Create a new Worker
3. Paste the code from `glint-analytics-pump.ts`
4. Add environment variable `GLINT_API_URL` with your API URL
5. Go to Settings > Triggers > Add Cron Trigger
6. Set schedule: `*/10 * * * *` (every 10 minutes)

## Configuration

### Cron Schedule

Edit `wrangler.toml` or the dashboard to change frequency:

- Every 10 minutes: `*/10 * * * *` (default)
- Every 5 minutes: `*/5 * * * *`
- Every 15 minutes: `*/15 * * * *`
- Every hour: `0 * * * *`
- Every day at midnight: `0 0 * * *`

### Manual Trigger

You can trigger the worker manually via HTTP GET request. The worker exposes a `fetch` handler that sends analytics data immediately.

**Get your worker URL:**
After deploying, Wrangler will show your worker URL, or find it in:

- Cloudflare Dashboard → Workers & Pages → glint-analytics-pump → Settings → Triggers
- Format: `https://glint-analytics-pump.{your-subdomain}.workers.dev`

**Trigger manually:**

```bash
# Basic trigger (raw JSON)
curl https://glint-analytics-pump.rss-reply.workers.dev

# Pretty JSON output (using Python - works on macOS)
curl -s https://glint-analytics-pump.rss-reply.workers.dev | python3 -m json.tool

# Pretty JSON output (using jq - if installed)
curl -s https://glint-analytics-pump.rss-reply.workers.dev | jq .

# Or just visit in your browser
# https://glint-analytics-pump.rss-reply.workers.dev
```

**Response format:**

```json
{
	"success": true,
	"timestamp": "2025-11-12T10:28:06.478Z",
	"events": 3,
	"location": {
		"country": "GB",
		"region": "Lombardy",
		"city": "Sydney"
	}
}
```

**What happens:**

- Sends 3 analytics events (location, referral, traffic source)
- Returns immediately with success status
- Data appears on your dashboard within seconds

## Environment Variables

- `GLINT_API_URL` (required): Your Glint API endpoint
  - Example: `https://your-app.vercel.app/api/trackAnalytics`
  - For local dev: `http://localhost:3000/api/trackAnalytics` (won't work from Cloudflare, need tunnel)

## Testing Locally

Use Wrangler's local dev mode:

```bash
wrangler dev
```

Then manually trigger:

```bash
curl http://localhost:8787
```

## Monitoring

Check Cloudflare Dashboard > Workers & Pages > Your Worker > Logs to see:

- Success/failure of API calls
- How many events are being sent
- Any errors
