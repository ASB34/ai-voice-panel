import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.created':
      // When a new subscription is created, create an agent for the user
      const newSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(newSubscription);
      
      // Create initial agent for new subscriber
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          const { createAgentForNewSubscription } = await import('@/lib/elevenlabs/agent-manager');
          const { getTeamByStripeCustomerId } = await import('@/lib/db/queries');
          
          const team = await getTeamByStripeCustomerId(newSubscription.customer as string);
          if (team) {
            // Find team owner to create agent for
            const { db } = await import('@/lib/db/drizzle');
            const { teamMembers, users } = await import('@/lib/db/schema');
            const { eq, and } = await import('drizzle-orm');
            
            const owner = await db.query.teamMembers.findFirst({
              where: and(
                eq(teamMembers.teamId, team.id),
                eq(teamMembers.role, 'owner')
              ),
              with: {
                user: true
              }
            });
            
            if (owner) {
              await createAgentForNewSubscription(owner.user.id);
              console.log(`Created initial agent for new subscriber: ${owner.user.email}`);
            }
          }
        } catch (error) {
          console.error('Failed to create initial agent for new subscriber:', error);
        }
      }
      break;
      
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
