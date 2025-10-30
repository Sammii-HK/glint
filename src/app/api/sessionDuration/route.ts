import { NextResponse } from 'next/server';
import { corsHeaders } from '@/utils/cors';
import { prisma } from '@/lib/prisma';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
export async function GET() {
  try {
    const data = await prisma.sessionMetrics.findMany();
    return NextResponse.json(data.map(d => ({ time: d.timestamp, averageSessionDuration: d.duration })));
  } catch (error) {
    console.error('❌ Error in sessionDuration API:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
