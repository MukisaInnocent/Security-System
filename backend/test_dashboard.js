const fetch = require('node-fetch');

(async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ceo@security.com', password: 'ceo123' })
    });
    const loginData = await loginRes.json();
    console.log('Login token:', loginData.access_token ? 'OK' : 'FAIL');

    if (!loginData.access_token) return;

    const statsRes = await fetch('http://localhost:3001/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${loginData.access_token}` }
    });
    console.log('Dashboard Stats Status:', statsRes.status);
    
    if (statsRes.status !== 200) {
      console.log(await statsRes.text());
    } else {
      console.log('Dashboard Stats loaded perfectly.');
    }
  } catch (error) {
    console.error('Test Failed:', error.message);
  }
})();
