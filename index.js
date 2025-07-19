const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');
const sharp = require('sharp');
const { PrismaClient } = require('./generated/prisma');

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Simple function to generate short IDs
function generateShortId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.use(express.json());
app.use(cors({
  exposedHeaders: ['X-Short-ID', 'X-Redirect-URL', 'X-QR-Metadata']
}));

// POST /api/qr: Create a new dynamic QR code
app.post('/api/qr', async (req, res) => {
  const { destination_url, color, format } = req.body;
  
  if (!destination_url) {
    return res.status(400).json({ error: 'destination_url is required' });
  }

  try {
    const shortId = generateShortId(8); // Generate 8-character short ID
    const baseUrl = `http://192.168.1.104:4000`; // Use actual IP address
    const qrRedirectUrl = `${baseUrl}/redirect/${shortId}`;
    
    // Create QR code in database
    const qrCode = await prisma.qRCode.create({
      data: {
        shortId,
        originalUrl: destination_url,
        color: color || '#000000',
        format: format || 'png'
      }
    });

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

    // Set response headers with short ID and redirect URL
    res.set('Content-Type', contentType);
    res.set('X-Short-ID', shortId);
    res.set('X-Redirect-URL', qrRedirectUrl);
    
    // Also return metadata in response body for easier testing
    res.set('X-QR-Metadata', JSON.stringify({
      shortId,
      redirectUrl: qrRedirectUrl,
      originalUrl: destination_url
    }));
    
    res.send(qrBuffer);

  } catch (err) {
    console.error('Error creating QR code:', err);
    res.status(500).json({ error: 'Failed to create QR code', details: err.message });
  }
});

// GET /redirect/:shortId: Redirect to the original URL
app.get('/redirect/:shortId', async (req, res) => {
  const { shortId } = req.params;
  
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { shortId }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    res.redirect(qrCode.originalUrl);
  } catch (err) {
    console.error('Error redirecting:', err);
    res.status(500).json({ error: 'Failed to redirect', details: err.message });
  }
});

// PUT /api/qr/:shortId: Update QR code destination
app.put('/api/qr/:shortId', async (req, res) => {
  const { shortId } = req.params;
  const { destination_url, color, format } = req.body;

  try {
    const qrCode = await prisma.qRCode.update({
      where: { shortId },
      data: {
        originalUrl: destination_url,
        color: color || '#000000',
        format: format || 'png'
      }
    });

    res.json({ 
      message: 'QR code updated successfully',
      shortId: qrCode.shortId,
      redirectUrl: `http://192.168.1.104:4000/redirect/${qrCode.shortId}`
    });
  } catch (err) {
    console.error('Error updating QR code:', err);
    res.status(500).json({ error: 'Failed to update QR code', details: err.message });
  }
});

// GET /api/qr/:shortId: Get QR code info
app.get('/api/qr/:shortId', async (req, res) => {
  const { shortId } = req.params;
  
  try {
    const qrCode = await prisma.qRCode.findUnique({
      where: { shortId }
    });

    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not found' });
    }

    const baseUrl = `http://192.168.1.104:4000`;
    res.json({
      shortId: qrCode.shortId,
      originalUrl: qrCode.originalUrl,
      redirectUrl: `${baseUrl}/redirect/${qrCode.shortId}`,
      color: qrCode.color,
      format: qrCode.format,
      createdAt: qrCode.createdAt,
      updatedAt: qrCode.updatedAt
    });
  } catch (err) {
    console.error('Error fetching QR code:', err);
    res.status(500).json({ error: 'Failed to fetch QR code', details: err.message });
  }
});

// Legacy endpoint for backward compatibility
app.post('/generate', async (req, res) => {
  const { destination_url, format, color } = req.body;
  if (!destination_url) {
    return res.status(400).json({ error: 'destination_url is required' });
  }
  try {
    const qrOptions = {
      color: {
        dark: color || '#000000',
        light: '#FFFFFF',
      },
      width: 400,
    };
    if (format === 'svg') {
      const svgString = await QRCode.toString(destination_url, { ...qrOptions, type: 'svg' });
      res.set('Content-Type', 'image/svg+xml');
      res.send(svgString);
    } else if (format === 'jpg') {
      const pngBuffer = await QRCode.toBuffer(destination_url, { ...qrOptions, type: 'png' });
      const jpgBuffer = await sharp(pngBuffer).jpeg().toBuffer();
      res.set('Content-Type', 'image/jpeg');
      res.send(jpgBuffer);
    } else {
      const qrBuffer = await QRCode.toBuffer(destination_url, { ...qrOptions, type: 'png' });
      res.set('Content-Type', 'image/png');
      res.send(qrBuffer);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dynamic QR Code Generator listening on port ${PORT}`);
}); 