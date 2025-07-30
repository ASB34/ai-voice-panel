const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function checkAdmin() {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/callcrafter';
    const sql = postgres(connectionString);
    
    console.log('🔍 Checking admin users...');
    
    const admins = await sql`
      SELECT id, email, name, "isSuperAdmin", "isActive", "lastLogin", "createdAt"
      FROM "adminUsers" 
      ORDER BY "createdAt" DESC;
    `;
    
    console.log('👥 Admin users found:', admins.length);
    admins.forEach(admin => {
      console.log(`  - ${admin.email} (ID: ${admin.id}, Active: ${admin.isActive}, Super: ${admin.isSuperAdmin})`);
    });
    
    await sql.end();
    
  } catch (error) {
    console.error('💥 Database check failed:', error.message);
  }
}

checkAdmin();
