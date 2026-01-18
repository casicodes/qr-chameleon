import { NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
