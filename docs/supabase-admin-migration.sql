-- ==============================================
-- Admin User Management Migration
-- user_profiles 테이블 + RLS 정책
-- ==============================================

-- user_profiles 테이블
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in BIGINT
);

-- RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 본인 조회 + 관리자 전체 조회
CREATE POLICY "Users read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt()->>'email' = 'issacma70@gmail.com');

-- 본인 수정 + 관리자 전체 수정
CREATE POLICY "Users update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id OR auth.jwt()->>'email' = 'issacma70@gmail.com');

-- 본인 삽입만 허용
CREATE POLICY "Users insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자만 삭제 가능
CREATE POLICY "Admin can delete profiles" ON user_profiles
  FOR DELETE USING (auth.jwt()->>'email' = 'issacma70@gmail.com');
