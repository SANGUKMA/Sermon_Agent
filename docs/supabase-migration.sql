-- ==========================================
-- Supabase Migration: Sermon AI Assistant
-- Run this in Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. sermon_projects
CREATE TABLE IF NOT EXISTS sermon_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  passage TEXT DEFAULT '',
  theme TEXT DEFAULT '',
  audience TEXT DEFAULT '',
  audience_context JSONB DEFAULT '{}',
  sermon_goal TEXT DEFAULT '',
  structure TEXT DEFAULT '',
  historical_context TEXT DEFAULT '',
  original_language TEXT DEFAULT '',
  theological_themes TEXT DEFAULT '',
  text_analysis JSONB DEFAULT '[]',
  hermeneutics JSONB DEFAULT '[]',
  journal TEXT DEFAULT '',
  meditation_entries JSONB DEFAULT '[]',
  application_points TEXT DEFAULT '',
  draft TEXT DEFAULT '',
  draft_versions JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  preaching_settings JSONB DEFAULT '{"speechRate":"normal","targetTime":20}',
  editor_settings JSONB DEFAULT '{"backgroundColor":"#ffffff","fontSize":18,"lineHeight":1.8}',
  version INT DEFAULT 1,
  mode TEXT DEFAULT 'deep',
  status TEXT DEFAULT 'planning',
  date TEXT,
  series_id TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at BIGINT,
  is_locked BOOLEAN DEFAULT FALSE,
  last_modified BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sermon_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
  ON sermon_projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. sermon_series
CREATE TABLE IF NOT EXISTS sermon_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  last_modified BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sermon_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own series"
  ON sermon_series FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. theological_profiles (one per user)
CREATE TABLE IF NOT EXISTS theological_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  denomination TEXT DEFAULT '',
  style TEXT DEFAULT '',
  avoidance TEXT DEFAULT '',
  guardrail TEXT DEFAULT '',
  preferred_structure TEXT DEFAULT '',
  default_audience JSONB DEFAULT '{}',
  last_modified BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE theological_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own profile"
  ON theological_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. custom_prompts
CREATE TABLE IF NOT EXISTS custom_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  last_modified BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE custom_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own prompts"
  ON custom_prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
