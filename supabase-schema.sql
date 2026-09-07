-- ============================================
-- SIMAK Database Schema for Supabase
-- BPS Kabupaten Flores Timur
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users
-- Menyimpan data pengguna (Admin & Aktor)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  team VARCHAR(100) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Aktor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk pencarian berdasarkan team dan nama
CREATE INDEX idx_users_team ON users(team);
CREATE INDEX idx_users_name ON users(name);

-- ============================================
-- Table: activities
-- Menyimpan data kegiatan lintas tim
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  team VARCHAR(100) NOT NULL,
  team_color VARCHAR(7) NOT NULL, -- Hex color code
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_name VARCHAR(255), -- Denormalized untuk performance
  start_date TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'overdue', 'delayed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  description TEXT,
  evidence_url TEXT, -- Link Google Drive untuk bukti dukung
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_deadline CHECK (deadline >= start_date)
);

-- Indexes untuk performa query
CREATE INDEX idx_activities_team ON activities(team);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_start_date ON activities(start_date);
CREATE INDEX idx_activities_deadline ON activities(deadline);

-- ============================================
-- Table: notifications
-- Menyimpan log notifikasi WhatsApp
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('created', 'reminder_h1', 'overdue', 'evidence_uploaded')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes untuk query notifications
CREATE INDEX idx_notifications_activity_id ON notifications(activity_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- Function: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger untuk auto-update updated_at pada users
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk auto-update updated_at pada activities
CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function: Auto-update status overdue
-- Dipanggil via cron job atau trigger berkala
-- ============================================
CREATE OR REPLACE FUNCTION update_overdue_activities()
RETURNS void AS $$
BEGIN
  UPDATE activities
  SET status = 'overdue'
  WHERE deadline < NOW()
    AND status NOT IN ('completed', 'overdue');
END;
$$ LANGUAGE plpgsql;

-- -- ============================================
-- -- Sample Data (Optional - untuk testing)
-- -- ============================================

-- -- Insert sample activities
-- INSERT INTO activities (title, team, team_color, actor_id, actor_name, start_date, deadline, status, progress, description) VALUES
-- (
--   'Sakernas',
--   'Statistik Sosial',
--   '#3B82F6',
--   (SELECT id FROM users WHERE name = 'Benedikta Bewa Da Gomez'),
--   'Benedikta Bewa Da Gomez',
--   '2026-08-10 09:00:00+07',
--   '2026-08-15 17:00:00+07',
--   'completed',
--   100,
--   'Survei Angkatan Kerja Nasional periode Agustus 2026'
-- ),
-- (
--   'KSA Padi',
--   'Produksi',
--   '#F97316',
--   (SELECT id FROM users WHERE name = 'Fridolinda Seruya Nakluy A.Md'),
--   'Fridolinda Seruya Nakluy A.Md',
--   '2026-08-12 08:00:00+07',
--   '2026-08-20 16:00:00+07',
--   'active',
--   65,
--   'Kerangka Sampel Area untuk survei padi'
-- );

-- ============================================
-- Row Level Security (RLS) - Optional
-- Aktifkan jika ingin kontrol akses berbasis user
-- ============================================

-- Enable RLS pada tabel users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS pada tabel activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Enable RLS pada tabel notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Semua user bisa read (public access)
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON notifications
  FOR SELECT USING (true);

-- Policy: Hanya Admin yang bisa insert/update/delete
-- NOTE: Ini perlu disesuaikan dengan auth system yang digunakan
-- Untuk sekarang, semua operasi diizinkan via service_role_key di backend

CREATE POLICY "Enable insert for service role only" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role only" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for service role only" ON users
  FOR DELETE USING (true);

CREATE POLICY "Enable insert for service role only" ON activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role only" ON activities
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for service role only" ON activities
  FOR DELETE USING (true);

CREATE POLICY "Enable insert for service role only" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for service role only" ON notifications
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for service role only" ON notifications
  FOR DELETE USING (true);
