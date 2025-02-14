import { PrismaClient } from '@prisma/client';
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// export async function GET() {
//   const data = await prisma.deviceMetrics.findMany();
//   return NextResponse.json(data.map(d => ({ label: d.deviceType, value: d.percentage })));
// }
import { optionsHandler } from '@/utils/cors';

export async function OPTIONS() {
  return optionsHandler();
}

// TODO UPDATE


export async function GET() {
  try {
    const data = await prisma.deviceMetrics.findMany();
    return NextResponse.json(data.map(d => ({ label: d.deviceType, value: d.percentage })));
  } catch (error) {
    console.error('❌ Error in deviceMetrics API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}