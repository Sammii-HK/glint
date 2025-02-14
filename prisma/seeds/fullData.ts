// Prisma Database Population Script for Glint Analytics
// Purpose: Seed database to populate charts from `~/src/components/Charts.tsx`
// Run with: `npx ts-node prisma/seed.ts`

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Seed Average Metrics (for time-series and session charts)
  await prisma.averageMetrics.createMany({
    data: [
      { hour: 10, dayOfWeek: 1, averageVisits: 120, averageSessionDuration: 5.2, averageNetworkSpeed: 50, deviceType: 'mobile', browser: 'Chrome', browserCount: 80, connectionType: '4G' },
      { hour: 11, dayOfWeek: 1, averageVisits: 95, averageSessionDuration: 4.5, averageNetworkSpeed: 48, deviceType: 'desktop', browser: 'Firefox', browserCount: 20, connectionType: 'WiFi' }
    ]
  });

  // Seed Location Metrics (for heatmap)
  await prisma.locationMetrics.createMany({
    data: [
      { country: 'US', region: 'California', city: 'Los Angeles', visitCount: 200 },
      { country: 'UK', region: 'England', city: 'London', visitCount: 150 }
    ]
  });

  // Seed Referral Metrics (for referral source chart)
  await prisma.referralMetrics.createMany({
    data: [
      { source: 'Google', visitCount: 300 },
      { source: 'Direct', visitCount: 220 },
      { source: 'Twitter', visitCount: 100 }
    ]
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => console.error('Error seeding database:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
