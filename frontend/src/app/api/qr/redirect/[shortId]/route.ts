import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: any
) {
  const { shortId } = params;
  try {
    const qrCode = await prisma.qRCode.findUnique({ where: { shortId } });
    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }
    return NextResponse.redirect(qrCode.originalUrl, 302);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to redirect', details: err.message }, { status: 500 });
  }
} 