const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: () => {
            try { return JSON.parse(data); } catch (e) { return null; }
          }
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FULL E2E SUITE FOR NO WAVE COMPANY E-MENU');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Categories
  console.log('\n--- 1. Testing GET /api/categories ---');
  let res = await request({ hostname: 'localhost', port: 3000, path: '/api/categories', method: 'GET' });
  assert(res.statusCode === 200, 'Categories endpoint returns 200');
  const categories = res.json();
  assert(Array.isArray(categories) && categories.length === 5, 'Contains all 5 specified categories');
  console.log('  Categories found:', categories.map(c => c.name).join(', '));

  // 2. Menu Items
  console.log('\n--- 2. Testing GET /api/menu-items ---');
  res = await request({ hostname: 'localhost', port: 3000, path: '/api/menu-items', method: 'GET' });
  assert(res.statusCode === 200, 'Menu items endpoint returns 200');
  const items = res.json();
  assert(Array.isArray(items) && items.length >= 20, `Contains 20+ dishes (${items.length} items found)`);
  assert(items.every(i => typeof i.isAvailable === 'boolean'), 'Every dish includes isAvailable boolean');
  
  const initialAvailable = items.filter(i => i.isAvailable);
  const initialOutOfStock = items.filter(i => !i.isAvailable);
  console.log(`  Items summary: ${initialAvailable.length} available, ${initialOutOfStock.length} out of stock`);
  initialOutOfStock.forEach(i => console.log(`    🚫 ${i.name} (${i.category?.name})`));

  // 3. Customer Menu HTML
  console.log('\n--- 3. Testing Public Customer Pages GET / and /menu ---');
  let homeRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
  assert(homeRes.statusCode === 200, 'Root route / returns 200 OK');
  assert(
    homeRes.data.includes('NO WAVE') || homeRes.data.toLowerCase().includes('nowave') || homeRes.data.includes('No Wave'),
    'Root page contains brand name "No Wave"'
  );

  let menuRes = await request({ hostname: 'localhost', port: 3000, path: '/menu?table=5', method: 'GET' });
  assert(menuRes.statusCode === 200, '/menu?table=5 returns 200 OK');
  assert(menuRes.data.includes('No Wave. Just Tilt.'), 'Menu contains tagline "No Wave. Just Tilt."');

  // 4. Admin Auth
  console.log('\n--- 4. Testing Admin Manager Authentication ---');
  const loginPayload = JSON.stringify({ email: 'manager@nowave.cafe', password: 'NoWave2024!' });
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, loginPayload);
  assert(res.statusCode === 200, 'Manager login successful (200 OK)');
  const setCookie = res.headers['set-cookie'];
  assert(setCookie && setCookie.some(c => c.includes('nowave-session')), 'Session cookie nowave-session issued');
  const sessionCookie = setCookie ? setCookie.find(c => c.includes('nowave-session')).split(';')[0] : '';

  // 5. Real-Time Availability Toggle
  console.log('\n--- 5. Testing Real-Time Availability Toggle Switch ---');
  const testDish = items.find(i => i.name.includes('Dal Makhani') || i.name.includes('Butter Chicken'));
  console.log(`  Selected test dish: "${testDish.name}" (Initial isAvailable: ${testDish.isAvailable})`);

  // Toggle OFF (Out of Stock)
  const toggleOffPayload = JSON.stringify({ isAvailable: false });
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/menu-items/${testDish.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(toggleOffPayload),
      'Cookie': sessionCookie
    }
  }, toggleOffPayload);
  assert(res.statusCode === 200, 'Toggle OFF request succeeded with 200 OK');
  const toggledOffDish = res.json();
  assert(toggledOffDish.isAvailable === false && toggledOffDish.isStruckOut === true, 'Dish is now marked OUT OF STOCK (isAvailable: false, isStruckOut: true)');

  // Verify through public GET /api/menu-items that dish is out of stock
  res = await request({ hostname: 'localhost', port: 3000, path: '/api/menu-items', method: 'GET' });
  const updatedItems = res.json();
  const foundUpdated = updatedItems.find(i => i.id === testDish.id);
  assert(foundUpdated.isAvailable === false, 'Customer API immediately reflects dish is OUT OF STOCK');

  // Toggle back ON (Available)
  const toggleOnPayload = JSON.stringify({ isAvailable: true });
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/menu-items/${testDish.id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(toggleOnPayload),
      'Cookie': sessionCookie
    }
  }, toggleOnPayload);
  assert(res.statusCode === 200, 'Toggle ON request succeeded with 200 OK');
  const toggledOnDish = res.json();
  assert(toggledOnDish.isAvailable === true && toggledOnDish.isStruckOut === false, 'Dish is restored to AVAILABLE (isAvailable: true, isStruckOut: false)');

  // 6. Bulk Reset All to Available (Start of Day)
  console.log('\n--- 6. Testing Bulk Action: Reset All to Available ---');
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/menu-items/reset',
    method: 'POST',
    headers: {
      'Cookie': sessionCookie
    }
  });
  assert(res.statusCode === 200, 'Reset all endpoint succeeded with 200 OK');
  const resetResult = res.json();
  assert(resetResult.success === true, `Reset confirmed (${resetResult.restoredCount} dishes restored)`);

  // Verify all dishes are now available
  res = await request({ hostname: 'localhost', port: 3000, path: '/api/menu-items', method: 'GET' });
  const allAvailableItems = res.json();
  const remainingOutOfStock = allAvailableItems.filter(i => !i.isAvailable);
  assert(remainingOutOfStock.length === 0, 'All dishes are now 100% AVAILABLE for customers');

  // 7. Table QR Code page
  console.log('\n--- 7. Testing Admin Table QR Route /admin/qr ---');
  res = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/qr',
    method: 'GET',
    headers: { 'Cookie': sessionCookie }
  });
  assert(res.statusCode === 200, '/admin/qr protected route accessed successfully');

  // 8. SSE Events Stream
  console.log('\n--- 8. Testing Server-Sent Events /api/events ---');
  const sseConnected = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/events',
      method: 'GET'
    }, (response) => {
      let chunkCount = 0;
      response.on('data', (chunk) => {
        const text = chunk.toString();
        if (text.includes('connected') || text.includes('data:')) {
          chunkCount++;
          req.destroy();
          resolve(true);
        }
      });
      setTimeout(() => {
        req.destroy();
        resolve(chunkCount > 0);
      }, 1500);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
  assert(sseConnected, 'SSE stream established and received initial heartbeat');

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Fatal error during test run:', e);
  process.exit(1);
});
