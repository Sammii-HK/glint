/**
 * Generate historical analytics data for the past 30 days
 * Creates realistic time-series data with trends and patterns
 * 
 * Usage:
 *   npx ts-node scripts/generate-historical-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COUNTRIES = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'MX', 'ES', 'IT', 'NL', 'SE'];
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
const CONNECTION_TYPES = ['4G', '5G', 'WiFi', '3G'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate data for past N days
async function generateHistoricalData(days: number = 30) {
  console.log(`\n🚀 Generating ${days} days of historical analytics data...\n`);

  const now = new Date();
  let totalCreated = 0;

  for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    
    // Create more data for recent days (simulating growth)
    const multiplier = 1 + (days - dayOffset) / days; // More data in recent days
    const recordsPerDay = Math.floor(randomInt(15, 30) * multiplier);

    for (let i = 0; i < recordsPerDay; i++) {
      const hour = randomInt(0, 23);
      const dayOfWeek = date.getDay();
      
      // Add some randomness to timestamp within the day
      const timestamp = new Date(date);
      timestamp.setHours(hour, randomInt(0, 59), randomInt(0, 59));

      const country = randomChoice(COUNTRIES);
      const region = randomChoice(REGIONS);
      const city = randomChoice(CITIES);
      const referrer = randomChoice(REFERRERS);
      const deviceType = randomChoice(DEVICE_TYPES);
      const browser = randomChoice(BROWSERS);
      const connectionType = randomChoice(CONNECTION_TYPES);

      // Simulate peak hours (more visits during business hours)
      const hourMultiplier = hour >= 9 && hour <= 17 ? 1.5 : 1;
      const visits = Math.floor(randomInt(1, 10) * hourMultiplier);
      const sessionDuration = randomFloat(30, 600); // 30 seconds to 10 minutes
      const networkSpeed = randomFloat(10, 150); // Mbps

      try {
        // Create average metrics
        await prisma.averageMetrics.create({
          data: {
            timestamp,
            hour,
            dayOfWeek,
            averageVisits: visits,
            averageSessionDuration: sessionDuration,
            averageNetworkSpeed: networkSpeed,
            deviceType,
            browser,
            browserCount: randomInt(1, 100),
            connectionType,
          },
        });

        // Create location metrics
        await prisma.locationMetrics.create({
          data: {
            timestamp,
            country,
            region,
            city,
            visitCount: visits,
          },
        });

        // Create referral metrics
        await prisma.referralMetrics.create({
          data: {
            timestamp,
            source: referrer,
            visitCount: visits,
          },
        });

        // Create traffic source
        await prisma.trafficSource.create({
          data: {
            sourceName: referrer,
            visitCount: visits,
          },
        });

        // Create session metrics (every 5th record)
        if (i % 5 === 0) {
          await prisma.sessionMetrics.create({
            data: {
              timestamp,
              duration: sessionDuration,
            },
          });
        }

        // Create device metrics (aggregated, so less frequent)
        if (i % 10 === 0) {
          const existing = await prisma.deviceMetrics.findFirst({
            where: { deviceType },
          });

          if (existing) {
            await prisma.deviceMetrics.update({
              where: { id: existing.id },
              data: {
                percentage: Math.min(100, existing.percentage + randomFloat(0.5, 2)),
              },
            });
          } else {
            await prisma.deviceMetrics.create({
              data: {
                deviceType,
                percentage: randomFloat(10, 50),
              },
            });
          }
        }

        totalCreated += 4; // 4 main records per iteration
      } catch (error) {
        // Continue on errors (duplicates, etc.)
        if (process.env.NODE_ENV === 'development') {
          console.error('Error creating record:', error);
        }
      }
    }

    if (dayOffset % 5 === 0 || dayOffset === 0) {
      console.log(`✅ Day ${days - dayOffset + 1}/${days + 1} completed (${date.toISOString().split('T')[0]})`);
    }
  }

  console.log(`\n✨ Generated ${totalCreated} analytics records across ${days + 1} days\n`);
}

async function main() {
  const days = parseInt(process.argv[2] || '30', 10);
  
  try {
    await generateHistoricalData(days);
    console.log('🎉 Historical data generation complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

