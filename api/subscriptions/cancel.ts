import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyUser } from '../_utils/auth';
import { supabaseAdmin } from '../_utils/supabaseAdmin';

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

  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!sub) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    if (sub.status === 'cancelled') {
      return res.status(400).json({ error: 'Already cancelled' });
    }

    // 구독 해지 — 현재 기간 끝까지 서비스 유지
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled. Service continues until period end.',
      periodEnd: sub.current_period_end,
    });
  } catch (err: any) {
    console.error('subscription/cancel error:', err);
    return res.status(500).json({ error: err.message });
  }
}
