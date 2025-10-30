/**
 * Script to generate and send test analytics data to populate the dashboard
 * 
 * Usage:
 *   npx ts-node scripts/generate-data.ts
 * 
 * Or set the GLINT_API_URL env var:
 *   GLINT_API_URL=https://your-app.vercel.app/api/trackAnalytics npx ts-node scripts/generate-data.ts
 */

const API_URL = process.env.GLINT_API_URL || 'http://localhost:3000/api/trackAnalytics';

// Sample data pools for realistic variety
const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX'];
const REGIONS = ['California', 'New York', 'Texas', 'London', 'Ontario', 'NSW', 'Bavaria', 'Île-de-France', 'Tokyo', 'São Paulo'];
const CITIES = ['San Francisco', 'New York', 'Austin', 'London', 'Toronto', 'Sydney', 'Munich', 'Paris', 'Tokyo', 'São Paulo'];
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
  'medium.com'
];

const DEVICE_TYPES = ['mobile', 'desktop', 'tablet'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];

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

    console.log(`✅ Sent ${type}:`, payload);
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

async function generateBatch(count: number) {
  console.log(`\n🚀 Generating ${count} analytics events...\n`);

  let successCount = 0;

  for (let i = 0; i < count; i++) {
    const country = randomChoice(COUNTRIES);
    const region = randomChoice(REGIONS);
    const city = randomChoice(CITIES);
    const referrer = randomChoice(REFERRERS);
    const deviceType = randomChoice(DEVICE_TYPES);
    const browser = randomChoice(BROWSERS);

    const timestamp = new Date();
    timestamp.setHours(randomInt(0, 23));
    timestamp.setDate(randomInt(1, 28));

    // Generate location metrics
    const locationSuccess = await sendAnalytics('location', {
      country,
      region,
      city,
      visitCount: randomInt(1, 5),
    });

    // Generate referral metrics
    const referralSuccess = await sendAnalytics('referral', {
      source: referrer,
      visitCount: randomInt(1, 10),
    });

    // Generate traffic source
    const trafficSuccess = await sendAnalytics('traffic', {
      sourceName: referrer,
      visitCount: randomInt(1, 8),
    });

    if (locationSuccess || referralSuccess || trafficSuccess) {
      successCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✨ Completed: ${successCount}/${count} batches sent successfully\n`);
}

async function main() {
  const count = parseInt(process.argv[2] || '50', 10);
  
  console.log(`📍 Target API: ${API_URL}`);
  console.log(`📊 Generating ${count} analytics events...\n`);

  await generateBatch(count);
  
  console.log('🎉 Data generation complete! Check your dashboard.');
}

main().catch(console.error);

