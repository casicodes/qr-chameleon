const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function debugTest() {
  console.log('🔍 Debugging Dynamic QR Code System...\n');

  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');

    // Test creating a QR code record
    console.log('2️⃣ Testing QR code creation...');
    const testQR = await prisma.qRCode.create({
      data: {
        shortId: 'TEST1234',
        originalUrl: 'https://example.com',
        color: '#000000',
        format: 'png'
      }
    });
    console.log('✅ QR code created in database:', testQR);
    console.log('');

    // Test finding the QR code
    console.log('3️⃣ Testing QR code retrieval...');
    const foundQR = await prisma.qRCode.findUnique({
      where: { shortId: 'TEST1234' }
    });
    console.log('✅ QR code found:', foundQR);
    console.log('');

    // Test updating the QR code
    console.log('4️⃣ Testing QR code update...');
    const updatedQR = await prisma.qRCode.update({
      where: { shortId: 'TEST1234' },
      data: {
        originalUrl: 'https://github.com'
      }
    });
    console.log('✅ QR code updated:', updatedQR);
    console.log('');

    // Clean up
    console.log('5️⃣ Cleaning up test data...');
    await prisma.qRCode.delete({
      where: { shortId: 'TEST1234' }
    });
    console.log('✅ Test data cleaned up!\n');

    console.log('🎉 Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTest(); 