import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.averageMetrics.create({
    data: {
      hour: 12,
      dayOfWeek: 3,
      averageVisits: 150,
      averageSessionDuration: 5.3,
      averageNetworkSpeed: 42.5,
      deviceType: 'mobile',
      browser: 'Chrome',
      browserCount: 80,
      connectionType: '4G'
    }
  });
  console.log('Database seeded with sample data.');
}

main()
  .catch((e: Error) => console.error(e))
  .finally(async () => await prisma.$disconnect());
  