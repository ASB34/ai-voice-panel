const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = postgres(connectionString);

async function testAuthentication() {
  try {
    const email = 'ahmedsaidbulut@gmail.com';
    const password = 'admin123';
    
    console.log('=== TESTING AUTHENTICATION ===');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Get admin from database
    const admin = await sql`
      SELECT * FROM "adminUsers" WHERE email = ${email.toLowerCase()} LIMIT 1;
    `;
    
    console.log('\n=== DATABASE QUERY RESULT ===');
    console.log('Admin found:', !!admin[0]);
    if (admin[0]) {
      console.log('Admin data:', {
        id: admin[0].id,
        email: admin[0].email,
        isActive: admin[0].isActive,
        passwordHash: admin[0].passwordHash.substring(0, 20) + '...'
      });
    }
    
    if (admin[0] && admin[0].isActive) {
      console.log('\n=== PASSWORD VERIFICATION ===');
      const isValidPassword = await bcrypt.compare(password, admin[0].passwordHash);
      console.log('Password valid:', isValidPassword);
      
      if (isValidPassword) {
        console.log('\n✅ AUTHENTICATION SHOULD SUCCEED');
      } else {
        console.log('\n❌ AUTHENTICATION SHOULD FAIL - INVALID PASSWORD');
      }
    } else {
      console.log('\n❌ AUTHENTICATION SHOULD FAIL - USER NOT FOUND OR INACTIVE');
    }
    
  } catch (error) {
    console.error('Error testing authentication:', error);
  } finally {
    await sql.end();
  }
}

testAuthentication();
