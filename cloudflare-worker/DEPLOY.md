# Quick Deploy Guide

## Option 1: Automated Deploy Script (Recommended)

Make sure you have `LIVE_SITE` in your `.env` file in the project root:

```bash
# From project root
cd cloudflare-worker
../deploy.sh
```

Or use the script directly:
```bash
./deploy.sh
```

## Option 2: Manual Setup

1. **Navigate to worker directory:**
   ```bash
   cd cloudflare-worker
   ```

2. **Install Wrangler (if not installed):**
   ```bash
   npm install -g wrangler
   ```

3. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

4. **Set your site URL as secret:**
   ```bash
   # Using LIVE_SITE from .env
   echo "https://glint-dun.vercel.app" | wrangler secret put LIVE_SITE
   
   # OR set the full API URL directly
   echo "https://glint-dun.vercel.app/api/trackAnalytics" | wrangler secret put GLINT_API_URL
   ```

5. **Deploy:**
   ```bash
   wrangler deploy
   ```

## Verify Deployment

1. **Check worker URL:**
   After deployment, Wrangler will show you the worker URL (e.g., `https://glint-analytics-pump.your-subdomain.workers.dev`)

2. **Test manually:**
   ```bash
   curl https://glint-analytics-pump.your-subdomain.workers.dev
   ```

3. **Check Cloudflare Dashboard:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Workers & Pages → glint-analytics-pump
   - View Logs to see cron executions

4. **Verify data in your app:**
   - Visit https://glint-dun.vercel.app
   - Check dashboard - data should appear within 10 minutes (first cron run)

## Troubleshooting

**Worker not running?**
- Check cron trigger is set: `wrangler.toml` → `crons = ["*/10 * * * *"]`
- Verify in Cloudflare Dashboard → Triggers

**No data appearing?**
- Check worker logs in Cloudflare Dashboard
- Verify `LIVE_SITE` or `GLINT_API_URL` secret is set correctly
- Test API endpoint: `curl https://glint-dun.vercel.app/api/trackAnalytics`

**Update frequency?**
Edit `wrangler.toml`:
```toml
crons = ["*/10 * * * *"]  # Every 10 minutes
crons = ["*/15 * * * *"]   # Every 15 minutes
crons = ["0 * * * *"]       # Every hour
```

Then redeploy: `wrangler deploy`

