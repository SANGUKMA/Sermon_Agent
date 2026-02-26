import { supabase } from './supabaseClient';

export interface SubscriptionState {
  plan: 'free' | 'pro' | 'church';
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  cardLast4?: string;
  cardCompany?: string;
  currentPeriodEnd?: string;
  nextChargeDate?: string;
  cancelledAt?: string;
  usage: {
    currentMonth: number;
    limit: number; // -1 = unlimited
    monthKey: string;
  };
}

const DEFAULT_STATE: SubscriptionState = {
  plan: 'free',
  status: 'active',
  usage: { currentMonth: 0, limit: 5, monthKey: '' },
};

let cachedState: SubscriptionState | null = null;

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export async function fetchSubscriptionState(): Promise<SubscriptionState> {
  const token = await getAccessToken();
  if (!token) return DEFAULT_STATE;

  try {
    const res = await fetch('/api/subscriptions/current', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return DEFAULT_STATE;

    const data = await res.json();
    const sub = data.subscription || {};

    const state: SubscriptionState = {
      plan: sub.plan || 'free',
      status: sub.status || 'active',
      cardLast4: sub.card_last4,
      cardCompany: sub.card_company,
      currentPeriodEnd: sub.current_period_end,
      nextChargeDate: sub.next_charge_date,
      cancelledAt: sub.cancelled_at,
      usage: data.usage || { currentMonth: 0, limit: 5, monthKey: '' },
    };

    cachedState = state;
    return state;
  } catch {
    return cachedState || DEFAULT_STATE;
  }
}

export function canMakeAICall(state: SubscriptionState): boolean {
  if (state.plan !== 'free') return true;
  return state.usage.currentMonth < state.usage.limit;
}

export async function logUsage(functionName: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await supabase.from('usage_logs').insert({
    user_id: user.id,
    function_name: functionName,
    month_key: monthKey,
  });

  // 캐시 업데이트
  if (cachedState) {
    cachedState.usage.currentMonth += 1;
  }
}

export async function cancelSubscription(): Promise<{ success: boolean; periodEnd?: string; error?: string }> {
  const token = await getAccessToken();

  const res = await fetch('/api/subscriptions/cancel', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error || 'Cancel failed' };
  }

  // 캐시 업데이트
  if (cachedState) {
    cachedState.status = 'cancelled';
    cachedState.cancelledAt = new Date().toISOString();
  }

  return { success: true, periodEnd: data.periodEnd };
}

export async function processPayment(
  authKey: string,
  customerKey: string,
  plan: string
): Promise<{ success: boolean; plan?: string; cardLast4?: string; periodEnd?: string; error?: string }> {
  const token = await getAccessToken();

  const res = await fetch('/api/payments/billing-auth', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authKey, customerKey, plan }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.error || 'Payment failed' };
  }

  // 캐시 무효화
  cachedState = null;

  return {
    success: true,
    plan: data.plan,
    cardLast4: data.cardLast4,
    periodEnd: data.periodEnd,
  };
}
