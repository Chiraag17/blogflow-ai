// scripts/test-auth-endpoints.mjs
import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('BlogFlow AI - Authentication & Protection Test Suite');
  console.log('====================================================\n');

  // Test 1: Verify Public Health Check
  console.log('[Test 1] Checking Public Health Endpoint (GET /api/health)...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log(`Status: ${healthRes.status} (Expected: 200)`);
  console.log('Response:', JSON.stringify(healthData));
  if (healthRes.status === 200) {
    console.log('✓ Health check endpoint is accessible and healthy!\n');
  } else {
    throw new Error(`Health check failed with status ${healthRes.status}`);
  }

  // Test 2: Verify Protected Route without Token (GET /api/websites)
  console.log('[Test 2] Checking Protected API Route without Auth (GET /api/websites)...');
  const unauthRes = await fetch(`${BASE_URL}/api/websites`);
  const unauthData = await unauthRes.json();
  console.log(`Status: ${unauthRes.status} (Expected: 401)`);
  console.log('Response:', JSON.stringify(unauthData));
  if (unauthRes.status === 401 && unauthData.error === 'Unauthorized') {
    console.log('✓ Middleware successfully blocked unauthenticated request with 401 Unauthorized!\n');
  } else {
    throw new Error(`Expected 401 Unauthorized, received ${unauthRes.status}`);
  }

  // Test 3: Test User Registration (POST /api/auth/register)
  const testEmail = `test_${Date.now()}@blogflow.test`;
  const testPassword = 'Password123!Secure';
  const testName = 'Test Automator';

  console.log(`[Test 3] Testing User Registration (POST /api/auth/register)...`);
  console.log(`Payload: { email: "${testEmail}", name: "${testName}", password: "[HIDDEN]" }`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  });

  const regData = await regRes.json();
  console.log(`Status: ${regRes.status} (Expected: 201)`);
  console.log('Response:', JSON.stringify(regData));
  if (regRes.status === 201 && regData.user?.email === testEmail) {
    console.log(`✓ User registered successfully! User ID: ${regData.user.id}, Role: ${regData.user.role}\n`);
  } else {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }

  // Test 3b: Test Duplicate Registration Rejection
  console.log('[Test 3b] Verifying Duplicate Email Rejection (POST /api/auth/register)...');
  const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  });
  const dupData = await dupRes.json();
  console.log(`Status: ${dupRes.status} (Expected: 409)`);
  console.log('Response:', JSON.stringify(dupData));
  if (dupRes.status === 409) {
    console.log('✓ Duplicate registration correctly rejected with 409 Conflict!\n');
  } else {
    throw new Error(`Expected 409 Conflict, received ${dupRes.status}`);
  }

  // Test 4: Test NextAuth Login Flow
  console.log('[Test 4] Testing NextAuth Credentials Login Flow...');
  // Step A: Fetch CSRF Token
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfCookies = (csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get('set-cookie') || ''])
    .map(c => c.split(';')[0])
    .join('; ');
  const { csrfToken } = await csrfRes.json();
  console.log('Retrieved CSRF token successfully.');

  // Step B: Submit Credentials
  const loginParams = new URLSearchParams({
    csrfToken,
    email: testEmail,
    password: testPassword,
    json: 'true',
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies,
    },
    body: loginParams.toString(),
    redirect: 'manual',
  });

  const loginSetCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || ''];
  console.log('Login Set-Cookies received:', loginSetCookies.length);
  const sessionCookies = loginSetCookies
    .map(c => c.split(';')[0])
    .join('; ');

  console.log(`Login response status: ${loginRes.status}`);

  // Step C: Verify Session with Cookie
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      'Cookie': sessionCookies,
    },
  });
  const sessionData = await sessionRes.json();
  console.log('Session response:', JSON.stringify(sessionData));
  if (sessionData.user?.email === testEmail) {
    console.log(`✓ NextAuth credentials login successful! Session verified for: ${sessionData.user.email} (Role: ${sessionData.user.role})\n`);
  } else {
    throw new Error(`Session verification failed: ${JSON.stringify(sessionData)}`);
  }

  // Test 5: Verify Protected API Route WITH Session Cookie (GET /api/websites)
  console.log('[Test 5] Calling Protected API Route WITH Authenticated Session (GET /api/websites)...');
  const authApiRes = await fetch(`${BASE_URL}/api/websites`, {
    headers: {
      'Cookie': sessionCookies,
    },
  });
  const authApiData = await authApiRes.json();
  console.log(`Status: ${authApiRes.status} (Expected: 200)`);
  console.log('Response:', JSON.stringify(authApiData));
  if (authApiRes.status === 200) {
    console.log('✓ Authenticated request passed middleware and reached API route successfully!\n');
  } else {
    throw new Error(`Expected 200 OK with session, received ${authApiRes.status}`);
  }

  console.log('====================================================');
  console.log('ALL AUTHENTICATION & SECURITY TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err.message);
  process.exit(1);
});
