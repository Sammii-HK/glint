#!/bin/bash
# Deploy script for Cloudflare Worker
# Make sure you're in the cloudflare-worker directory

cd "$(dirname "$0")"

# Kill any existing wrangler processes to prevent conflicts
echo "🧹 Checking for existing wrangler processes..."
if pgrep -f "wrangler dev" > /dev/null || pgrep -f "workerd serve" > /dev/null; then
    echo "⚠️  Found existing wrangler processes, killing them..."
    pkill -f "wrangler dev" 2>/dev/null
    pkill -f "workerd serve" 2>/dev/null
    sleep 1
    echo "✅ Cleaned up existing processes"
fi

echo "🚀 Deploying Glint Analytics Worker to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "📝 Please login to Cloudflare:"
    wrangler login
fi

# Load .env file if it exists (from parent directory)
if [ -f "../.env" ]; then
    source ../.env
    echo "✅ Loaded environment variables from .env"
fi

# Check if LIVE_SITE is set
if [ -z "$LIVE_SITE" ]; then
    echo "⚠️  LIVE_SITE not found in .env"
    echo "Please set LIVE_SITE in your .env file or manually set GLINT_API_URL:"
    echo "  wrangler secret put GLINT_API_URL"
    echo ""
    read -p "Enter your API URL (or press Enter to use LIVE_SITE): " api_url
    
    if [ -z "$api_url" ]; then
        read -p "Enter your live site URL (e.g., https://glint-dun.vercel.app): " live_site
        if [ -n "$live_site" ]; then
            echo "Setting LIVE_SITE as secret..."
            echo "$live_site" | wrangler secret put LIVE_SITE
        fi
    else
        echo "Setting GLINT_API_URL as secret..."
        echo "$api_url" | wrangler secret put GLINT_API_URL
    fi
else
    echo "✅ Using LIVE_SITE: $LIVE_SITE"
    echo "$LIVE_SITE" | wrangler secret put LIVE_SITE
fi

# Deploy
echo ""
echo "🚀 Deploying worker..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Your worker will run every 10 minutes and populate analytics data."
echo "🔗 View logs: https://dash.cloudflare.com -> Workers & Pages -> glint-analytics-pump -> Logs"

