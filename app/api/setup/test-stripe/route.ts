import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const { stripeSecretKey } = await request.json();
    
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe secret key is required' }, { status: 400 });
    }
    
    // Test Stripe connection
    const stripe = new Stripe(stripeSecretKey);
    
    try {
      // Try to retrieve account information
      const account = await stripe.accounts.retrieve();
      
      return NextResponse.json({ 
        success: true,
        accountId: account.id,
        country: account.country
      });
    } catch (error: any) {
      console.error('Stripe connection test failed:', error);
      return NextResponse.json({ 
        error: 'Stripe connection failed',
        details: error?.message || 'Unknown error'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Stripe test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
