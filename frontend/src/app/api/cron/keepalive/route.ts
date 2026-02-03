import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  // Note: Vercel Cron jobs are protected at the infrastructure level
  // Only Vercel's cron scheduler can trigger these endpoints in production
  // No additional auth needed for internal cron endpoints

  try {
    // Perform a simple query to keep the database active
    await prisma.qRCode.findFirst({
      select: { id: true },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Database keepalive successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Keepalive error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
