-- FitAI Supabase Schema
-- Run this migration on your Supabase project via SQL Editor

-- Users table (linked to Telegram)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (onboarding data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gender TEXT,
  age INTEGER,
  height REAL,
  weight REAL,
  goal TEXT,
  activity_level TEXT,
  experience_level TEXT,
  tdee REAL,
  target_calories REAL,
  protein REAL,
  fat REAL,
  carbs REAL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Food entries
CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories REAL,
  protein REAL,
  fat REAL,
  carbs REAL,
  portion_size TEXT,
  meal_type TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout logs
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT,
  name TEXT,
  exercises JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  date DATE,
  duration_minutes INTEGER
);

-- Weight entries
CREATE TABLE IF NOT EXISTS weight_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight REAL NOT NULL,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurements
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chest REAL,
  waist REAL,
  hips REAL,
  left_arm REAL,
  right_arm REAL,
  left_thigh REAL,
  right_thigh REAL,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplements
CREATE TABLE IF NOT EXISTS supplements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  schedule TEXT[],
  notes TEXT,
  active BOOLEAN DEFAULT true
);

-- Supplement logs
CREATE TABLE IF NOT EXISTS supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES supplements(id) ON DELETE CASCADE,
  date DATE,
  taken BOOLEAN DEFAULT false
);

-- Steroid cycles
CREATE TABLE IF NOT EXISTS steroid_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  compounds JSONB,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  notes TEXT
);

-- PCT entries
CREATE TABLE IF NOT EXISTS pct_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_id UUID REFERENCES steroid_cycles(id) ON DELETE CASCADE,
  compound TEXT,
  dosage TEXT,
  start_date DATE,
  duration_weeks INTEGER,
  notes TEXT
);

-- ===== Row Level Security =====

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE steroid_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pct_entries ENABLE ROW LEVEL SECURITY;

-- ===== RLS Policies =====
-- Using anon key with service_role or disabling RLS for anon access.
-- For a simple setup (anon key used directly from client), allow all operations.
-- In production, use Supabase Edge Functions with JWT verification.

-- Users: anyone with anon key can manage their own row by telegram_id
CREATE POLICY "users_all" ON users FOR ALL USING (true) WITH CHECK (true);

-- For tables with user_id, allow all (since we filter by user_id in queries)
-- In production, replace with proper JWT-based policies
CREATE POLICY "user_profiles_all" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "food_entries_all" ON food_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "workout_logs_all" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "weight_entries_all" ON weight_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "measurements_all" ON measurements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "supplements_all" ON supplements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "supplement_logs_all" ON supplement_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "steroid_cycles_all" ON steroid_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pct_entries_all" ON pct_entries FOR ALL USING (true) WITH CHECK (true);

-- ===== Indexes =====

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON measurements(user_id, date);
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_date ON supplement_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_steroid_cycles_user ON steroid_cycles(user_id);
