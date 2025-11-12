#!/bin/bash
# Quick backfill script using the Cloudflare Worker
# Triggers the worker multiple times to backfill data

WORKER_URL="https://glint-analytics-pump.rss-reply.workers.dev"
BATCHES=${1:-36}  # Default: 36 batches = 6 hours (6 batches/hour × 6 hours)
DELAY=10  # 10 seconds between batches (matching cron schedule)

echo "🚀 Backfilling via Cloudflare Worker..."
echo "   Worker: $WORKER_URL"
echo "   Batches: $BATCHES (${BATCHES} batches × 3 events = $((BATCHES * 3)) events)"
echo "   Delay: ${DELAY}s between batches"
echo ""

for i in $(seq 1 $BATCHES); do
  echo -n "Batch $i/$BATCHES: "
  RESPONSE=$(curl -s "$WORKER_URL")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    EVENTS=$(echo "$RESPONSE" | grep -o '"events":[0-9]*' | grep -o '[0-9]*')
    echo "✅ $EVENTS events sent"
  else
    echo "❌ Failed"
    echo "   Response: $RESPONSE"
  fi
  
  if [ $i -lt $BATCHES ]; then
    sleep $DELAY
  fi
done

echo ""
echo "✨ Backfill complete!"

