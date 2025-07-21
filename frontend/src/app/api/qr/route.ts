import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import QRCode from 'qrcode';
import sharp from 'sharp';

const prisma = new PrismaClient();

function generateShortId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  const { destination_url, color, format, existingShortId } = await req.json();

  if (!destination_url) {
    return NextResponse.json({ error: 'destination_url is required' }, { status: 400 });
  }

  try {
    let shortId = existingShortId;

    if (shortId) {
      // If a shortId is provided, update the existing QR code
      await prisma.qRCode.update({
        where: { shortId },
        data: {
          originalUrl: destination_url,
          color: color || '#000000',
          format: format || 'png',
        },
      });
    } else {
      // If no shortId is provided, create a new one
      shortId = generateShortId(8);
      await prisma.qRCode.create({
        data: {
          shortId,
          originalUrl: destination_url,
          color: color || '#000000',
          format: format || 'png',
        },
      });
    }

    const baseUrl = req.nextUrl.origin;
    const qrRedirectUrl = `${baseUrl}/api/qr/redirect/${shortId}`;
    
    // Generate QR code image
    const qrOptions = {
      color: {
        dark: color || '#000000',
        light: '#FFFFFF',
      },
      width: 400,
    };
    let qrBuffer;
    let contentType;
    if (format === 'svg') {
      const svgString = await QRCode.toString(qrRedirectUrl, { ...qrOptions, type: 'svg' });
      qrBuffer = Buffer.from(svgString);
      contentType = 'image/svg+xml';
    } else if (format === 'jpg') {
      const pngBuffer = await QRCode.toBuffer(qrRedirectUrl, { ...qrOptions, type: 'png' });
      qrBuffer = await sharp(pngBuffer).jpeg().toBuffer();
      contentType = 'image/jpeg';
    } else {
      qrBuffer = await QRCode.toBuffer(qrRedirectUrl, { ...qrOptions, type: 'png' });
      contentType = 'image/png';
    }
    // Set response headers
    const res = new NextResponse(qrBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Short-ID': shortId,
        'X-Redirect-URL': qrRedirectUrl,
      },
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create QR code', details: err.message }, { status: 500 });
  }
} 