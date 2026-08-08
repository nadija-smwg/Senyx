import * as fs from 'fs';

async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@senyx.com', password: 'password' })
  });
  const loginData = await loginRes.json();
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login:', loginData);

  const dashRes = await fetch('http://localhost:3000/api/analytics/dashboard', {
    headers: { Cookie: cookies || '' }
  });
  console.log('Status:', dashRes.status);
  const dashData = await dashRes.json();
  console.log('Dashboard Data:', Object.keys(dashData.data || {}));
}
test();
