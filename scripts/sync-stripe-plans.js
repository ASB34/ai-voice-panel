require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { Client } = require('pg');

// Stripe instance oluştur
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function syncPlansWithStripe() {
  console.log('🔄 Stripe ile planları senkronize ediliyor...');
  
  try {
    await client.connect();
    
    // Mevcut planları veritabanından al
    const result = await client.query('SELECT * FROM subscription_plans ORDER BY id');
    const plans = result.rows;
    
    for (const plan of plans) {
      if (plan.stripe_product_id && plan.stripe_price_id) {
        console.log(`✅ ${plan.display_name} zaten Stripe ile senkronize`);
        continue;
      }
      
      console.log(`🔄 ${plan.display_name} için Stripe ürünü oluşturuluyor...`);
      
      // Stripe'da ürün oluştur
      const product = await stripe.products.create({
        name: plan.display_name,
        description: plan.description,
        metadata: {
          planId: plan.id.toString(),
          planName: plan.name
        }
      });
      
      // Aylık fiyat oluştur
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly_price, // Zaten cent cinsinden
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          planId: plan.id.toString(),
          billing: 'monthly'
        }
      });
      
      // Yıllık fiyat oluştur (eğer varsa)
      let yearlyPrice = null;
      if (plan.yearly_price && plan.yearly_price > 0) {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.yearly_price, // Zaten cent cinsinden
          currency: 'usd',
          recurring: {
            interval: 'year'
          },
          metadata: {
            planId: plan.id.toString(),
            billing: 'yearly'
          }
        });
      }
      
      // Veritabanını güncelle - sadece monthly price ID'yi kaydedelim
      await client.query(
        'UPDATE subscription_plans SET stripe_product_id = $1, stripe_price_id = $2, updated_at = NOW() WHERE id = $3',
        [product.id, monthlyPrice.id, plan.id]
      );
      
      console.log(`✅ ${plan.display_name} Stripe ile senkronize edildi`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Monthly Price ID: ${monthlyPrice.id}`);
      if (yearlyPrice) {
        console.log(`   Yearly Price ID: ${yearlyPrice.id}`);
      }
      console.log('');
    }
    
    console.log('\n🎉 Tüm planlar Stripe ile senkronize edildi!');
    console.log('\n📋 Sonraki adımlar:');
    console.log('1. Stripe Dashboard\'da ürünlerinizi kontrol edin');
    console.log('2. Webhook endpoint\'ini ayarlayın');
    console.log('3. Pricing sayfasında "Paketi Seç" butonları artık çalışacak');
    
  } catch (error) {
    console.error('❌ Stripe senkronizasyon hatası:', error);
  } finally {
    await client.end();
  }
}

// Script'i çalıştır
if (require.main === module) {
  syncPlansWithStripe()
    .then(() => {
      console.log('✅ Script tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { syncPlansWithStripe };
