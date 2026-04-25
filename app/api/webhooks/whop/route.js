import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const event = body.event;
    const membership = body.data;

    if (!event || !membership) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
    const signature = request.headers.get('x-whop-signature');

    if (webhookSecret && signature) {
      // In production, verify the signature
      // For now, we'll skip signature verification for development
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const membershipId = membership.id;
    const email = membership.email || membership.user_email;
    const planId = membership.plan_id;

    let tier = 'free';
    if (planId?.includes('pro')) {
      tier = 'pro';
    } else if (planId?.includes('enterprise')) {
      tier = 'enterprise';
    }

    switch (event) {
      case 'membership.activated':
      case 'membership.updated':
        await supabase
          .from('profiles')
          .update({
            whop_membership_id: membershipId,
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email);
        break;

      case 'membership.cancelled':
      case 'membership.expired':
        await supabase
          .from('profiles')
          .update({
            whop_membership_id: null,
            subscription_tier: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('whop_membership_id', membershipId);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}