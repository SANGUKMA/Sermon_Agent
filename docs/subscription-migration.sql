-- Sermon-AI비서 SaaS 결제/구독/사용량 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. user_profiles에 plan 컬럼 추가
ALTER TABLE user_profiles ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'pro', 'church'));

-- 2. subscriptions 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled','past_due','expired')),
  billing_key TEXT,
  customer_key TEXT,
  card_last4 TEXT,
  card_company TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  next_charge_date DATE,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own sub" ON subscriptions FOR SELECT USING (auth.uid()=user_id);

-- 3. usage_logs 테이블
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  month_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_usage_user_month ON usage_logs(user_id, month_key);
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON usage_logs FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Users insert own usage" ON usage_logs FOR INSERT WITH CHECK (auth.uid()=user_id);

-- 4. payments 테이블
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  toss_payment_key TEXT,
  toss_order_id TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SUCCESS','FAILED','REFUNDED','PENDING')),
  paid_at TIMESTAMPTZ,
  failed_reason TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON payments FOR SELECT USING (auth.uid()=user_id);
