import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, subscriptionPlans } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { priceId, planId, billingPeriod } = await request.json();
    
    // Kullanıcıyı al
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Kullanıcının team'ini al
    const userTeam = await db.query.teamMembers.findFirst({
      where: eq(teamMembers.userId, user.id),
      with: {
        team: true
      }
    });
    
    if (!userTeam) {
      return NextResponse.json({ error: 'No team found' }, { status: 400 });
    }
    
    // Subscription plan'ı al
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId)
    });
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }
    
    // Doğru price ID'yi belirle
    let finalPriceId = plan.stripePriceId;
    
    // Eğer yıllık faturalama isteniyorsa ve yıllık fiyat varsa
    if (billingPeriod === 'yearly' && plan.yearlyPrice && plan.yearlyPrice > 0) {
      // Stripe'dan yıllık price'ı bul
      const prices = await stripe.prices.list({
        product: plan.stripeProductId || undefined,
        active: true,
        type: 'recurring'
      });
      
      const yearlyPrice = prices.data.find(p => 
        p.recurring?.interval === 'year' && 
        p.metadata?.planId === planId.toString()
      );
      
      if (yearlyPrice) {
        finalPriceId = yearlyPrice.id;
      }
    }
    
    if (!finalPriceId) {
      return NextResponse.json({ error: 'Price ID not found' }, { status: 400 });
    }
    
    // Stripe checkout session oluştur
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/pricing`,
      customer: userTeam.team.stripeCustomerId || undefined,
      client_reference_id: user.id.toString(),
      allow_promotion_codes: true,
      subscription_data: {
        // Trial kaldırıldı - direkt ödeme başlayacak
        metadata: {
          planId: planId.toString(),
          teamId: userTeam.team.id.toString()
        }
      },
      metadata: {
        planId: planId.toString(),
        teamId: userTeam.team.id.toString(),
        userId: user.id.toString()
      }
    });
    
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' }, 
      { status: 500 }
    );
  }
}
