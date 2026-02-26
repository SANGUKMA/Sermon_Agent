import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tossRequest } from '../_utils/toss';
import { supabaseAdmin } from '../_utils/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 크론잡 인증
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: dueSubscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .lte('next_charge_date', today);

  if (error) {
    console.error('charge: query error', error);
    return res.status(500).json({ error: error.message });
  }

  const results: Array<{ userId: string; success: boolean; error?: string }> = [];

  for (const sub of dueSubscriptions || []) {
    const orderId = `RENEW-${sub.user_id.slice(0, 8)}-${Date.now()}`;
    try {
      const payment = await tossRequest('POST', `/v1/billing/${sub.billing_key}`, {
        customerKey: sub.customer_key,
        amount: sub.amount,
        orderId,
        orderName: `Sermon-AI비서 ${sub.plan === 'pro' ? '프로' : '교회'} 플랜 갱신`,
      });

      const now = new Date();
      const nextEnd = new Date(now);
      nextEnd.setMonth(nextEnd.getMonth() + 1);

      // 기간 갱신
      await supabaseAdmin
        .from('subscriptions')
        .update({
          current_period_start: now.toISOString(),
          current_period_end: nextEnd.toISOString(),
          next_charge_date: nextEnd.toISOString().split('T')[0],
          updated_at: now.toISOString(),
        })
        .eq('id', sub.id);

      // 결제 기록
      await supabaseAdmin.from('payments').insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        toss_payment_key: payment.paymentKey,
        toss_order_id: orderId,
        amount: sub.amount,
        status: 'SUCCESS',
        paid_at: now.toISOString(),
        receipt_url: payment.receipt?.url || null,
      });

      results.push({ userId: sub.user_id, success: true });
    } catch (err: any) {
      console.error(`charge failed for ${sub.user_id}:`, err);

      // 결제 실패: past_due + free 전환
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sub.id);

      await supabaseAdmin
        .from('user_profiles')
        .update({ plan: 'free' })
        .eq('user_id', sub.user_id);

      // 실패 기록
      await supabaseAdmin.from('payments').insert({
        user_id: sub.user_id,
        subscription_id: sub.id,
        toss_order_id: orderId,
        amount: sub.amount,
        status: 'FAILED',
        failed_reason: err.message,
      });

      results.push({ userId: sub.user_id, success: false, error: err.message });
    }
  }

  return res.status(200).json({
    processed: results.length,
    results,
  });
}
