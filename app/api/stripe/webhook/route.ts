import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const profileId = session.metadata?.profile_id;
        const priceKey = session.metadata?.price_key;
        const credits = session.metadata?.credits;

        if (!profileId) break;

        if (priceKey?.startsWith('premium_')) {
          // Activate premium
          await supabase
            .from('profiles')
            .update({
              premium: true,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileId);
          console.log(`Premium activated for ${profileId}`);
        } else if (credits) {
          // Add date request credits
          const creditAmount = parseInt(credits);
          const { data: profile } = await supabase
            .from('profiles')
            .select('date_request_credits')
            .eq('id', profileId)
            .single();

          const currentCredits = profile?.date_request_credits || 0;
          await supabase
            .from('profiles')
            .update({
              date_request_credits: currentCredits + creditAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileId);
          console.log(`Added ${creditAmount} credits to ${profileId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const profileId = subscription.metadata?.profile_id;

        if (profileId) {
          await supabase
            .from('profiles')
            .update({
              premium: false,
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileId);
          console.log(`Premium deactivated for ${profileId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const profileId = subscription.metadata?.profile_id;

        if (profileId) {
          const isActive = subscription.status === 'active' || subscription.status === 'trialing';
          await supabase
            .from('profiles')
            .update({
              premium: isActive,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profileId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const profileId = subscription.metadata?.profile_id;
          if (profileId) {
            console.log(`Payment failed for ${profileId}`);
            // Optionally notify user, but don't revoke premium immediately
          }
        }
        break;
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
