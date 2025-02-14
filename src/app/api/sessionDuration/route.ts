import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { optionsHandler } from '@/utils/cors';

export async function OPTIONS() {
  return optionsHandler();
}

const prisma = new PrismaClient();
export async function GET() {
  try {
    const data = await prisma.sessionMetrics.findMany();
    return NextResponse.json(data.map(d => ({ time: d.timestamp, averageSessionDuration: d.duration })));
  } catch (error) {
    console.error('❌ Error in sessionDuration API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
