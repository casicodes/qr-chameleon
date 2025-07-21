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
  { params }: any
) {
  const { shortId } = params;
  const { destination_url, color, format } = await req.json();

  const dataToUpdate: { originalUrl?: string; color?: string; format?: string } = {};
  if (destination_url) dataToUpdate.originalUrl = destination_url;
  if (color) dataToUpdate.color = color;
  if (format) dataToUpdate.format = format;

  if (Object.keys(dataToUpdate).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const qrCode = await prisma.qRCode.update({
      where: { shortId },
      data: dataToUpdate,
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