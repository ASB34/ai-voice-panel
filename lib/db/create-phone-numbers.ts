import { sql } from 'drizzle-orm';
import { db } from './drizzle';

async function createPhoneNumbersTable() {
  console.log('🔧 Creating phone_numbers table...');
  
  try {
    // Create phone_numbers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS phone_numbers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id integer NOT NULL REFERENCES users(id),
        phone_number varchar(20) NOT NULL,
        phone_number_id text,
        assigned_agent_id uuid REFERENCES voice_agents(id),
        status varchar(20) DEFAULT 'active' NOT NULL,
        provider varchar(50),
        country varchar(3),
        area_code varchar(10),
        label varchar(100),
        system_data text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS phone_numbers_user_id_idx ON phone_numbers (user_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS phone_numbers_phone_number_idx ON phone_numbers (phone_number);
    `);
    
    console.log('✅ Phone numbers table created successfully!');
  } catch (error) {
    console.error('❌ Error creating phone numbers table:', error);
    process.exit(1);
  }
}

createPhoneNumbersTable().then(() => {
  console.log('✅ Database setup complete!');
  process.exit(0);
});
