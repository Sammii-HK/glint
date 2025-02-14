// import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
const prisma = new PrismaClient();

// export async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
//   if (req.method === 'GET') {
//     try {
//       const locationMetrics = await prisma.locationMetrics.findMany();
//       res.status(200).json(locationMetrics);
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to fetch location metrics', message: error });
//     }
//   }
// }
import { headerOrigin, optionsHandler } from '@/utils/cors';

export async function OPTIONS() {
  return optionsHandler();
}

export async function GET() {
  try {
    const locationMetrics = await prisma.locationMetrics.findMany();
    if (!locationMetrics.length) {
      return NextResponse.json({ error: 'No location metrics found' }, { status: 404 });
    }
    return NextResponse.json(locationMetrics, { status: 200, headers: headerOrigin });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
