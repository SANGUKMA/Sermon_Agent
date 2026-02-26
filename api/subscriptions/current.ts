import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUser } from '../_utils/auth';
import { supabaseAdmin } from '../_utils/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let userId: string;
  try {
    userId = await verifyUser(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 구독 정보 조회 (billing_key 제외)
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, plan, status, card_last4, card_company, current_period_start, current_period_end, next_charge_date, amount, created_at, updated_at, cancelled_at')
      .eq('user_id', userId)
      .single();

    // 이번 달 사용량 조회
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { count } = await supabaseAdmin
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('month_key', monthKey);

    const plan = subscription?.plan || 'free';
    const limit = plan === 'free' ? 5 : -1; // -1 = unlimited

    return res.status(200).json({
      subscription: subscription || { plan: 'free', status: 'active' },
      usage: {
        currentMonth: count || 0,
        limit,
        monthKey,
      },
    });
  } catch (err: any) {
    console.error('subscription/current error:', err);
    return res.status(500).json({ error: err.message });
  }
}
