const fetch = require('node-fetch');

async function testDynamicQR() {
  console.log('🧪 Testing Dynamic QR Code System...\n');

  try {
    // Step 1: Create a QR code
    console.log('1️⃣ Creating QR code for https://google.com...');
    const createResponse = await fetch('http://localhost:4000/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_url: 'https://google.com',
        format: 'png',
        color: '#000000'
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create QR code: ${createResponse.status}`);
    }

    const shortId = createResponse.headers.get('X-Short-ID');
    const redirectUrl = createResponse.headers.get('X-Redirect-URL');
    const metadata = createResponse.headers.get('X-QR-Metadata');
    
    let parsedMetadata = null;
    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.log('Could not parse metadata header');
      }
    }
    
    console.log(`✅ QR Code created successfully!`);
    console.log(`   Short ID: ${shortId || parsedMetadata?.shortId || 'null'}`);
    console.log(`   Redirect URL: ${redirectUrl || parsedMetadata?.redirectUrl || 'null'}`);
    console.log(`   Metadata:`, parsedMetadata || 'null');
    console.log('');

    const actualShortId = shortId || parsedMetadata?.shortId;
    if (!actualShortId) {
      throw new Error('No short ID received from server');
    }

    // Step 2: Test the redirect
    console.log('2️⃣ Testing redirect functionality...');
    const redirectResponse = await fetch(`http://localhost:4000/redirect/${actualShortId}`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects automatically
    });

    if (redirectResponse.status === 302) {
      const location = redirectResponse.headers.get('location');
      console.log(`✅ Redirect working! Redirects to: ${location}\n`);
    } else {
      console.log(`❌ Redirect failed: ${redirectResponse.status}\n`);
    }

    // Step 3: Update the destination URL
    console.log('3️⃣ Testing dynamic update...');
    const updateResponse = await fetch(`http://localhost:4000/api/qr/${actualShortId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination_url: 'https://github.com',
        color: '#e53935',
        format: 'png'
      })
    });

    if (updateResponse.ok) {
      const updateData = await updateResponse.json();
      console.log(`✅ QR Code updated successfully!`);
      console.log(`   New redirect URL: ${updateData.redirectUrl}\n`);
    } else {
      const errorData = await updateResponse.json();
      console.log(`❌ Update failed: ${errorData.error}\n`);
    }

    // Step 4: Test the updated redirect
    console.log('4️⃣ Testing updated redirect...');
    const updatedRedirectResponse = await fetch(`http://localhost:4000/redirect/${actualShortId}`, {
      method: 'GET',
      redirect: 'manual'
    });

    if (updatedRedirectResponse.status === 302) {
      const location = updatedRedirectResponse.headers.get('location');
      console.log(`✅ Updated redirect working! Now redirects to: ${location}\n`);
    } else {
      console.log(`❌ Updated redirect failed: ${updatedRedirectResponse.status}\n`);
    }

    console.log('🎉 Dynamic QR Code test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - QR Code created with short ID: ${actualShortId}`);
    console.log(`   - Original destination: https://google.com`);
    console.log(`   - Updated destination: https://github.com`);
    console.log(`   - Same QR code, different destination!`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDynamicQR(); 