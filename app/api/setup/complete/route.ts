import { NextResponse, NextRequest } from 'next/server';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { databaseUrl, stripeSecretKey } = await request.json();
    
    if (!databaseUrl || !stripeSecretKey) {
      return NextResponse.json({ 
        error: 'Database URL and Stripe secret key are required' 
      }, { status: 400 });
    }
    
    const client = new Client({ connectionString: databaseUrl });
    
    try {
      await client.connect();
      
      // Seed default pricing plans
      const checkPlansQuery = 'SELECT COUNT(*) FROM pricing_plans';
      const planCount = await client.query(checkPlansQuery);
      
      if (parseInt(planCount.rows[0].count) === 0) {
        // Insert default plans
        const insertPlansQuery = `
          INSERT INTO pricing_plans (
            name, description, price, credits, stripe_price_id, 
            features, is_popular, created_at, updated_at
          ) VALUES 
          (
            'Starter', 
            'Perfect for small businesses getting started', 
            990, 
            100, 
            'price_starter', 
            '["100 AI voice calls", "Basic analytics", "Email support"]', 
            false, 
            NOW(), 
            NOW()
          ),
          (
            'Professional', 
            'Ideal for growing businesses', 
            2990, 
            500, 
            'price_professional', 
            '["500 AI voice calls", "Advanced analytics", "Priority support", "Custom voice training"]', 
            true, 
            NOW(), 
            NOW()
          ),
          (
            'Enterprise', 
            'For large-scale operations', 
            9990, 
            2000, 
            'price_enterprise', 
            '["2000 AI voice calls", "Full analytics suite", "24/7 dedicated support", "Custom integrations", "White-label options"]', 
            false, 
            NOW(), 
            NOW()
          )
        `;
        
        await client.query(insertPlansQuery);
      }
      
      await client.end();
      
      return NextResponse.json({ 
        success: true,
        message: 'Setup completed successfully! Your application is ready to use.'
      });
    } catch (dbError: any) {
      await client.end();
      console.error('Setup completion error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to complete setup',
        details: dbError?.message || 'Unknown error'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Complete setup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
