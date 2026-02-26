import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUser } from '../_utils/auth';
import { tossRequest } from '../_utils/toss';
import { supabaseAdmin } from '../_utils/supabaseAdmin';

const PLAN_PRICES: Record<string, number> = {
  pro: 19900,
  church: 49900,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId: string;
  try {
    userId = await verifyUser(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { authKey, customerKey, plan } = req.body || {};

  if (!authKey || !customerKey || !plan || !PLAN_PRICES[plan]) {
    return res.status(400).json({ error: 'Missing or invalid parameters' });
  }

  try {
    // 1. 빌링키 발급
    const billing = await tossRequest('POST', '/v1/billing/authorizations/issue', {
      authKey,
      customerKey,
    });

    const billingKey = billing.billingKey;
    const cardLast4 = billing.card?.number?.slice(-4) || '';
    const cardCompany = billing.card?.company || '';

    // 2. 첫 결제
    const amount = PLAN_PRICES[plan];
    const orderId = `ORDER-${userId.slice(0, 8)}-${Date.now()}`;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const payment = await tossRequest('POST', `/v1/billing/${billingKey}`, {
      customerKey,
      amount,
      orderId,
      orderName: `Sermon-AI비서 ${plan === 'pro' ? '프로' : '교회'} 플랜 (월간)`,
    });

    // 3. subscriptions UPSERT
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          user_id: userId,
          plan,
          status: 'active',
          billing_key: billingKey,
          customer_key: customerKey,
          card_last4: cardLast4,
          card_company: cardCompany,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          next_charge_date: periodEnd.toISOString().split('T')[0],
          amount,
          updated_at: now.toISOString(),
          cancelled_at: null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    // 4. user_profiles.plan 업데이트
    await supabaseAdmin
      .from('user_profiles')
      .update({ plan })
      .eq('user_id', userId);

    // 5. payments INSERT
    await supabaseAdmin.from('payments').insert({
      user_id: userId,
      subscription_id: sub?.id,
      toss_payment_key: payment.paymentKey,
      toss_order_id: orderId,
      amount,
      status: 'SUCCESS',
      paid_at: now.toISOString(),
      receipt_url: payment.receipt?.url || null,
    });

    return res.status(200).json({
      success: true,
      plan,
      cardLast4,
      periodEnd: periodEnd.toISOString(),
    });
  } catch (err: any) {
    console.error('billing-auth error:', err);
    return res.status(500).json({ error: err.message || 'Payment failed' });
  }
}
