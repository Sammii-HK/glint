/**
 * Backfill missing analytics data by sending batches via API
 * Simulates data over the past few hours to fill gaps
 * 
 * Usage:
 *   npx ts-node scripts/backfill-data.ts
 *   npx ts-node scripts/backfill-data.ts 6    # Backfill last 6 hours
 *   npx ts-node scripts/backfill-data.ts 24    # Backfill last 24 hours
 * 
 * Or set the GLINT_API_URL env var:
 *   GLINT_API_URL=https://glint-dun.vercel.app/api/trackAnalytics npx ts-node scripts/backfill-data.ts
 */

const API_URL = process.env.GLINT_API_URL || 'http://localhost:3000/api/trackAnalytics';

// Sample data pools for realistic variety
const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX', 'ES', 'IT', 'NL', 'SE'];
const REGIONS = [
  'California', 'New York', 'Texas', 'London', 'Ontario', 'NSW',
  'Bavaria', 'Île-de-France', 'Tokyo', 'São Paulo', 'Madrid', 'Lombardy'
];
const CITIES = [
  'San Francisco', 'New York', 'Austin', 'London', 'Toronto', 'Sydney',
  'Munich', 'Paris', 'Tokyo', 'São Paulo', 'Madrid', 'Milan'
];
const REFERRERS = [
  'google.com',
  'twitter.com',
  'facebook.com',
  'reddit.com',
  'github.com',
  'direct',
  'news.ycombinator.com',
  'linkedin.com',
  'youtube.com',
  'medium.com',
  'producthunt.com',
  'dev.to'
];

async function sendAnalytics(type: string, payload: any) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to send ${type}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Error sending ${type}:`, error);
    return false;
  }
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function backfillHours(hours: number) {
  console.log(`\n🚀 Backfilling ${hours} hours of analytics data...\n`);
  console.log(`📍 Target API: ${API_URL}\n`);

  const now = Date.now();
  const batchInterval = 10 * 60 * 1000; // 10 minutes between batches (matching cron schedule)
  const batchesPerHour = 6; // 6 batches per hour (every 10 minutes)
  const totalBatches = hours * batchesPerHour;

  let successCount = 0;
  let totalEvents = 0;

  // Generate batches going backwards in time
  for (let i = 0; i < totalBatches; i++) {
    const batchTime = now - (i * batchInterval);
    const batchDate = new Date(batchTime);
    
    // Generate 3 events per batch (matching worker behavior)
    const country = randomChoice(COUNTRIES);
    const region = randomChoice(REGIONS);
    const city = randomChoice(CITIES);
    const referrer = randomChoice(REFERRERS);

    const results = await Promise.all([
      sendAnalytics('location', {
        country,
        region,
        city,
        visitCount: randomInt(1, 5),
      }),
      sendAnalytics('referral', {
        source: referrer,
        visitCount: randomInt(1, 10),
      }),
      sendAnalytics('traffic', {
        sourceName: referrer,
        visitCount: randomInt(1, 8),
      }),
    ]);

    const batchSuccess = results.filter(Boolean).length;
    successCount += batchSuccess;
    totalEvents += batchSuccess;

    if (batchSuccess > 0) {
      console.log(
        `✅ Batch ${i + 1}/${totalBatches} (${batchDate.toISOString()}): ${batchSuccess}/3 events`
      );
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`\n✨ Backfill complete!`);
  console.log(`   Total batches: ${totalBatches}`);
  console.log(`   Successful events: ${totalEvents}`);
  console.log(`   Success rate: ${Math.round((successCount / (totalBatches * 3)) * 100)}%\n`);
}

async function main() {
  const hours = parseInt(process.argv[2] || '6', 10);
  
  if (hours < 1 || hours > 48) {
    console.error('❌ Hours must be between 1 and 48');
    process.exit(1);
  }

  console.log(`📊 Backfilling ${hours} hour${hours !== 1 ? 's' : ''} of analytics data`);
  console.log(`   This will create ~${hours * 18} events (6 batches/hour × 3 events/batch)\n`);

  await backfillHours(hours);
  
  console.log('🎉 Backfill complete! Check your dashboard.');
}

main().catch(console.error);

