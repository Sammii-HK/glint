#!/bin/bash
# Kill any running wrangler processes to prevent conflicts

echo "🧹 Checking for wrangler processes..."

WRANGLER_PIDS=$(pgrep -f "wrangler dev" 2>/dev/null)
WORKERD_PIDS=$(pgrep -f "workerd serve" 2>/dev/null)

if [ -z "$WRANGLER_PIDS" ] && [ -z "$WORKERD_PIDS" ]; then
    echo "✅ No wrangler processes found"
    exit 0
fi

if [ -n "$WRANGLER_PIDS" ]; then
    echo "⚠️  Found wrangler dev processes: $WRANGLER_PIDS"
    pkill -f "wrangler dev"
fi

if [ -n "$WORKERD_PIDS" ]; then
    echo "⚠️  Found workerd processes: $WORKERD_PIDS"
    pkill -f "workerd serve"
fi

sleep 1

# Verify they're gone
if pgrep -f "wrangler dev" > /dev/null || pgrep -f "workerd serve" > /dev/null; then
    echo "❌ Some processes are still running, trying force kill..."
    pkill -9 -f "wrangler dev" 2>/dev/null
    pkill -9 -f "workerd serve" 2>/dev/null
    sleep 1
fi

if pgrep -f "wrangler dev" > /dev/null || pgrep -f "workerd serve" > /dev/null; then
    echo "❌ Failed to kill all processes"
    exit 1
else
    echo "✅ All wrangler processes killed"
fi

