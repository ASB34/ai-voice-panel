const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login...');
    
    const response = await fetch('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ahmedsaidbulut@gmail.com',
        password: '123456'
      })
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response data:', data);
    
  } catch (error) {
    console.error('💥 Login test failed:', error.message);
  }
}

testAdminLogin();
