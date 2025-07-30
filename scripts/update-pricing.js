const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function updatePlans() {
  try {
    console.log('Updating subscription plans...');
    
    // Free paketini sil
    await sql`DELETE FROM subscription_plans WHERE name = 'free'`;
    console.log('Deleted free plan');
    
    // Diğer paketlerin fiyatlarını güncelle
    await sql`
      UPDATE subscription_plans 
      SET monthly_price = 89900, yearly_price = 719200, display_name = 'Starter'
      WHERE name = 'starter'
    `;
    console.log('Updated starter plan: $899/month');
    
    await sql`
      UPDATE subscription_plans 
      SET monthly_price = 179900, yearly_price = 1439200, display_name = 'Professional'
      WHERE name = 'professional'
    `;
    console.log('Updated professional plan: $1799/month');
    
    await sql`
      UPDATE subscription_plans 
      SET monthly_price = 299900, yearly_price = 2399200, display_name = 'Enterprise'
      WHERE name = 'enterprise'
    `;
    console.log('Updated enterprise plan: $2999/month');
    
    // Güncellenmiş planları göster
    const plans = await sql`SELECT * FROM subscription_plans ORDER BY monthly_price`;
    console.log('\nUpdated plans:');
    plans.forEach(plan => {
      console.log(`- ${plan.display_name}: $${plan.monthly_price/100}/month, $${plan.yearly_price/100}/year`);
    });
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error updating plans:', error);
    process.exit(1);
  }
}

updatePlans();
