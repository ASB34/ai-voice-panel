const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function checkAdmin() {
  try {
    const admins = await sql`SELECT * FROM "adminUsers"`;
    console.log('Admin users:');
    console.table(admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isSuperAdmin: admin.isSuperAdmin,
      isActive: admin.isActive
    })));
    
    if (admins.length === 0) {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await sql`
        INSERT INTO "adminUsers" (email, "passwordHash", name, "isSuperAdmin", "isActive")
        VALUES ('admin@example.com', ${hashedPassword}, 'Admin User', true, true)
      `;
      
      console.log('Admin user created: admin@example.com / admin123');
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
  }
}

checkAdmin();
