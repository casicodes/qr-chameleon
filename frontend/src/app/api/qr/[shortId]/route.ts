import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { shortId: string } }
) {
  const { shortId } = params;
  try {
    const qrCode = await prisma.qRCode.findUnique({ where: { shortId } });
    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }
    const baseUrl = req.nextUrl.origin;
    return NextResponse.json({
      shortId: qrCode.shortId,
      originalUrl: qrCode.originalUrl,
      redirectUrl: `${baseUrl}/api/qr/redirect/${qrCode.shortId}`,
      color: qrCode.color,
      format: qrCode.format,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch QR code', details: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { shortId: string } }
) {
  const { shortId } = params;
  const { destination_url, color, format } = await req.json();
  try {
    const qrCode = await prisma.qRCode.update({
      where: { shortId },
      data: {
        originalUrl: destination_url,
        color: color || '#000000',
        format: format || 'png',
      },
    });
    const baseUrl = req.nextUrl.origin;
    return NextResponse.json({
      message: 'QR code updated successfully',
      shortId: qrCode.shortId,
      redirectUrl: `${baseUrl}/api/qr/redirect/${qrCode.shortId}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update QR code', details: err.message }, { status: 500 });
  }
} 