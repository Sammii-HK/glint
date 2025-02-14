import { corsHeaders } from './../../../utils/cors';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse<TimeSeriesData | { error: string }>
// ): Promise<void> {
//   if (req.method === 'GET') {
//     try {
//       const averageMetrics = await prisma.averageMetrics.findMany({
//         orderBy: { hour: 'asc' }
//       });

//       const formattedData: TimeSeriesData = averageMetrics.map(item => ({
//         time: item.timestamp.toISOString(),
//         averageVisits: item.averageVisits,
//         averageSessionDuration: item.averageSessionDuration,
//         averageNetworkSpeed: item.averageNetworkSpeed,
//       }));

//       res.status(200).json(formattedData);
//     } catch (error: unknown) {
//       res.status(500).json({ error: (error as Error).message || 'Failed to fetch average metrics' });
//     }
//   } else {
//     res.status(405).json({ error: 'Method Not Allowed' });
//   }
// }

// export async function GET(): Promise<NextResponse<TimeSeriesData | { error: string }>> {
//   try {
//     const averageMetrics = await prisma.averageMetrics.findMany({
//       orderBy: { hour: 'asc' }
//     });

//     if (!averageMetrics.length) {
//       return NextResponse.json({ error: 'No data found' }, { status: 404 });
//     }

//     const formattedData: TimeSeriesData = averageMetrics.map(item => ({
//       time: item.timestamp.toISOString(),
//       averageVisits: item.averageVisits,
//       averageSessionDuration: item.averageSessionDuration,
//       averageNetworkSpeed: item.averageNetworkSpeed,
//     }));

//     return NextResponse.json(formattedData, { status: 200 });
//   } catch (error: unknown) {
//     return NextResponse.json(
//       { error: (error as Error).message || 'Failed to fetch average metrics' },
//       { status: 500 }
//     );
//   }
// }

// export async function OPTIONS() {
//   return optionsHandler();
// }

// export async function GET() {
//   try {
//     const averageMetrics = await prisma.averageMetrics.findMany({ orderBy: { hour: 'asc' } });
//     if (!averageMetrics.length) {
//       return NextResponse.json({ error: 'No average metrics found' }, { status: 404 });
//     }
//     return new Response(JSON.stringify({ message: 'Average Metrics Data' }), {
//       status: 200,
//       headers: {
//         'Content-Type': 'application/json',
//         'Access-Control-Allow-Origin': '*',
//         'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
//         'Access-Control-Allow-Headers': 'Content-Type, Authorization'
//       }
//     });
//     // return NextResponse.json(averageMetrics, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ error: (error as Error).message }, { status: 500 });
//   }
// }
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const averageMetrics = await prisma.averageMetrics.findMany();
    const headers = corsHeaders();

    console.log("averageMetrics", averageMetrics);
    

    // if (!averageMetrics.length) {
    //   return NextResponse.json({ error: 'No average metrics found' }, { status: 404, headers });
    // }
    return NextResponse.json(averageMetrics, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500, headers: corsHeaders() });
  }
}
