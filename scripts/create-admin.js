const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Database connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('DATABASE_URL or POSTGRES_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

async function createAdminUser() {
  try {
    // First, create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "adminUsers" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "name" varchar(100),
        "isSuperAdmin" boolean DEFAULT false NOT NULL,
        "isActive" boolean DEFAULT true NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        "lastLogin" timestamp,
        CONSTRAINT "adminUsers_email_unique" UNIQUE("email")
      );
    `;
    
    console.log('Table created successfully');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Insert admin user directly with SQL
    const result = await sql`
      INSERT INTO "adminUsers" (email, "passwordHash", name, "isSuperAdmin", "isActive", "createdAt")
      VALUES (
        'ahmedsaidbulut@gmail.com',
        ${passwordHash},
        'Ahmed Said Bulut',
        true,
        true,
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        "passwordHash" = ${passwordHash},
        "isActive" = true,
        "updatedAt" = NOW()
      RETURNING *;
    `;
    
    console.log('Admin user created/updated successfully:', result[0]);
    
    // Test the authentication
    const admin = await sql`
      SELECT * FROM "adminUsers" WHERE email = 'ahmedsaidbulut@gmail.com';
    `;
    
    console.log('Admin user in database:', admin[0]);
    
    // Test password verification
    const isValidPassword = await bcrypt.compare('admin123', admin[0].passwordHash);
    console.log('Password verification test:', isValidPassword);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sql.end();
  }
}

createAdminUser();
