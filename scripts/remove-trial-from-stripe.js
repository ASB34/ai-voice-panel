require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { Client } = require('pg');

// Stripe instance oluştur
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function removeTrialFromStripePlans() {
  console.log('🔄 Stripe planlarından trial kaldırılıyor...');
  
  try {
    await client.connect();
    
    // Mevcut planları veritabanından al
    const result = await client.query('SELECT * FROM subscription_plans WHERE stripe_product_id IS NOT NULL ORDER BY id');
    const plans = result.rows;
    
    for (const plan of plans) {
      console.log(`🔄 ${plan.display_name} için Stripe prices güncelleniyor...`);
      
      // Bu product için tüm price'ları al
      const prices = await stripe.prices.list({
        product: plan.stripe_product_id,
        active: true
      });
      
      for (const price of prices.data) {
        // Eğer price'da trial varsa, yeni price oluştur (Stripe'da mevcut price'ı değiştiremiyoruz)
        if (price.recurring && price.recurring.trial_period_days) {
          console.log(`  🔄 Trial'lı price güncelleniyor: ${price.id}`);
          
          // Eski price'ı deaktive et
          await stripe.prices.update(price.id, {
            active: false
          });
          
          // Yeni price oluştur (trial olmadan)
          const newPrice = await stripe.prices.create({
            product: plan.stripe_product_id,
            unit_amount: price.unit_amount,
            currency: price.currency,
            recurring: {
              interval: price.recurring.interval,
              // trial_period_days kaldırıldı
            },
            metadata: price.metadata
          });
          
          // Eğer bu monthly price ise, database'i güncelle
          if (price.recurring.interval === 'month' && price.id === plan.stripe_price_id) {
            await client.query(
              'UPDATE subscription_plans SET stripe_price_id = $1, updated_at = NOW() WHERE id = $2',
              [newPrice.id, plan.id]
            );
            console.log(`  ✅ Database güncellendi - yeni monthly price: ${newPrice.id}`);
          }
          
          console.log(`  ✅ Yeni price oluşturuldu: ${newPrice.id} (trial olmadan)`);
        } else {
          console.log(`  ✅ ${price.id} zaten trial olmadan`);
        }
      }
      
      console.log('');
    }
    
    console.log('\n🎉 Tüm planlardan trial kaldırıldı!');
    console.log('\n📋 Sonraki adımlar:');
    console.log('1. Stripe Dashboard\'da yeni price\'ları kontrol edin');
    console.log('2. Eski trial\'lı price\'lar deaktive edildi');
    console.log('3. Artık direkt ödeme başlayacak');
    
  } catch (error) {
    console.error('❌ Trial kaldırma hatası:', error);
  } finally {
    await client.end();
  }
}

// Script'i çalıştır
if (require.main === module) {
  removeTrialFromStripePlans()
    .then(() => {
      console.log('✅ Script tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = { removeTrialFromStripePlans };
