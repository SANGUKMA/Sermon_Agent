import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_utils/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;

  if (!event || !event.eventType) {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    switch (event.eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        const { paymentKey, status } = event.data || {};
        if (paymentKey && status) {
          const mappedStatus = status === 'DONE' ? 'SUCCESS'
            : status === 'CANCELED' ? 'REFUNDED'
            : status;

          await supabaseAdmin
            .from('payments')
            .update({ status: mappedStatus })
            .eq('toss_payment_key', paymentKey);
        }
        break;
      }

      case 'BILLING_KEY_STATUS_CHANGED': {
        const { billingKey, status } = event.data || {};
        if (billingKey && status === 'EXPIRED') {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'expired',
              updated_at: new Date().toISOString(),
            })
            .eq('billing_key', billingKey);
        }
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
}
