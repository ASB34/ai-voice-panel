const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function quickTest() {
  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres:postgres@127.0.0.1:5432/callcrafter';
    const sql = postgres(connectionString);
    
    console.log('🔌 Testing database connection...');
    
    // Test connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection OK');
    
    // Check adminUsers table
    const admins = await sql`
      SELECT id, email, name, "isSuperAdmin", "isActive", "lastLogin", "createdAt"
      FROM "adminUsers" 
      ORDER BY "lastLogin" DESC NULLS LAST
      LIMIT 5;
    `;
    
    console.log('👥 Admin users found:', admins.length);
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (ID: ${admin.id}, Active: ${admin.isActive}, Last Login: ${admin.lastLogin || 'Never'})`);
    });
    
    await sql.end();
    
  } catch (error) {
    console.error('💥 Database test failed:', error.message);
  }
}

quickTest();
