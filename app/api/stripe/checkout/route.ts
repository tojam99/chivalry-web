import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Price IDs from Stripe
const PRICES: Record<string, string> = {
  premium_weekly: 'price_1TIfU3LglnlaUeGadYMppKL6',
  premium_monthly: 'price_1TIfUTLglnlaUeGalI0apiFk',
  premium_quarterly: 'price_1TIfUrLglnlaUeGay29C6oQO',
  credits_2: 'price_1TIfWALglnlaUeGaSMqIwPw9',
  credits_5: 'price_1TIfWULglnlaUeGaW8QbTCN4',
  credits_10: 'price_1TIfWvLglnlaUeGa4uh4nQN0',
  credits_20: 'price_1TIfYJLglnlaUeGayaoxwYku',
};

const CREDIT_AMOUNTS: Record<string, number> = {
  credits_2: 2,
  credits_5: 5,
  credits_10: 10,
  credits_20: 20,
};

export async function POST(req: NextRequest) {
  try {
    const { priceKey, profileId, authId } = await req.json();

    if (!priceKey || !PRICES[priceKey]) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    if (!profileId || !authId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const priceId = PRICES[priceKey];
    const isSubscription = priceKey.startsWith('premium_');

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', profileId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || undefined,
        metadata: { profile_id: profileId, auth_id: authId },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profileId);
    }

    // Create checkout session
    const sessionConfig: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${req.nextUrl.origin}/profile?checkout=success&type=${priceKey}`,
      cancel_url: `${req.nextUrl.origin}/profile?checkout=cancel`,
      metadata: {
        profile_id: profileId,
        price_key: priceKey,
        ...(CREDIT_AMOUNTS[priceKey] ? { credits: String(CREDIT_AMOUNTS[priceKey]) } : {}),
      },
    };

    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: { profile_id: profileId, price_key: priceKey },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
