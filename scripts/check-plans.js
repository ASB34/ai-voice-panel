const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

async function checkPlans() {
  try {
    const plans = await sql`SELECT * FROM subscription_plans ORDER BY monthly_price`;
    console.log('Existing plans:');
    console.table(plans);
    
    if (plans.length === 0) {
      console.log('No plans found. Creating default plans...');
      
      await sql`
        INSERT INTO subscription_plans (
          name, display_name, description, monthly_price, yearly_price,
          max_voice_agents, max_phone_numbers, max_conversations_per_month, 
          max_minutes_per_month, max_custom_voices, has_advanced_analytics,
          has_api_access, has_priority_support, is_active
        ) VALUES 
        ('starter', 'Starter', 'Perfect for small businesses getting started', 89900, 719200, 5, 2, 1000, 500, 0, false, false, false, true),
        ('professional', 'Professional', 'Best for growing businesses', 179900, 1439200, 25, 10, 5000, 2500, 5, true, true, false, true),
        ('enterprise', 'Enterprise', 'For large organizations', 299900, 2399200, -1, -1, -1, -1, -1, true, true, true, true)
      `;
      
      console.log('Default plans created successfully!');
      
      // Show created plans
      const newPlans = await sql`SELECT * FROM subscription_plans ORDER BY monthly_price`;
      console.table(newPlans);
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
  }
}

checkPlans();
