# Pushover Notification Setup

This guide will help you set up Pushover notifications to alert you when the analytics worker hasn't posted data for more than 1 hour.

## Step 1: Get Pushover Credentials

1. **Create a Pushover account** (if you don't have one):
   - Go to https://pushover.net/
   - Sign up for a free account

2. **Get your User Key**:
   - After logging in, you'll see your User Key on the dashboard
   - Copy this value

3. **Create an Application**:
   - Go to https://pushover.net/apps/build
   - Fill in:
     - Name: `Glint Analytics Worker`
     - Description: `Alerts when analytics worker stops posting`
     - Type: `Script`
   - Click "Create Application"
   - Copy the **API Token/Key** shown

## Step 2: Create KV Namespace

Create a Cloudflare KV namespace to store the last successful post timestamp:

```bash
cd cloudflare-worker
wrangler kv:namespace create "LAST_POST_KV"
```

This will output something like:
```
🌀  Creating namespace with title "glint-analytics-pump-LAST_POST_KV"
✨  Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "LAST_POST_KV", id = "abc123def456..." }
```

Copy the `id` value and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "LAST_POST_KV"
id = "abc123def456..."  # Paste the id from above
```

## Step 3: Set Pushover Secrets

Set your Pushover credentials as Cloudflare Worker secrets:

```bash
cd cloudflare-worker

# Set your Pushover User Key
wrangler secret put PUSHOVER_USER
# When prompted, paste your User Key

# Set your Pushover API Token
wrangler secret put PUSHOVER_TOKEN
# When prompted, paste your API Token
```

## Step 4: Deploy

Deploy the updated worker:

```bash
wrangler deploy
```

## How It Works

- **Every cron run** (every 10 minutes), the worker checks if the last successful post was more than 1 hour ago
- If **no data posted for > 1 hour**, you'll receive a Pushover notification
- The notification includes:
  - Alert title: `⚠️ Glint Analytics Worker Alert`
  - Message showing how long it's been since last post
  - Timestamp of last successful post

## Testing

To test the notification system:

1. Manually trigger the worker to record a successful post:
   ```bash
   curl https://glint-analytics-pump.rss-reply.workers.dev
   ```

2. Wait 1+ hour (or temporarily modify the threshold in code for testing)

3. The next cron run will detect the stale state and send a notification

## Disabling Notifications

If you want to temporarily disable notifications, just remove the secrets:

```bash
wrangler secret delete PUSHOVER_USER
wrangler secret delete PUSHOVER_TOKEN
```

The worker will continue to function normally, just without alerts.


