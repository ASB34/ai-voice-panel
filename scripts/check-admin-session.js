const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = postgres(connectionString);

async function checkAdminSession() {
  try {
    // Check admin users table
    const admins = await sql`
      SELECT id, email, name, "isSuperAdmin", "isActive", "lastLogin", "createdAt"
      FROM "adminUsers" 
      ORDER BY "lastLogin" DESC NULLS LAST;
    `;
    
    console.log('=== ADMIN USERS ===');
    console.log(admins);
    
    // Check recent login activity
    const recentLogin = admins.find(admin => admin.lastLogin);
    if (recentLogin) {
      console.log('\n=== RECENT LOGIN ===');
      console.log('Email:', recentLogin.email);
      console.log('Last Login:', recentLogin.lastLogin);
      console.log('Status: LOGIN SUCCESS ✅');
    } else {
      console.log('\n=== NO RECENT LOGINS ===');
      console.log('Status: NO LOGIN DETECTED ❌');
    }
    
  } catch (error) {
    console.error('Error checking admin session:', error);
  } finally {
    await sql.end();
  }
}

checkAdminSession();
