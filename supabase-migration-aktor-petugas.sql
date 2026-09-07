-- ============================================
-- SIMAK Schema Update: Pemisahan Aktor & Petugas
-- Tanggal: 2 September 2026
-- ============================================

-- Konsep:
-- - AKTOR (actor_id) = PIC/Penanggung Jawab/Instruktur (1 orang, bisa lintas tim)
-- - PETUGAS (activity_officers) = Tim Pelaksana (banyak orang, lintas tim)

-- ============================================
-- Table: activity_officers (Relasi Many-to-Many)
-- Menyimpan relasi kegiatan dengan petugas pelaksana
-- ============================================
CREATE TABLE IF NOT EXISTS activity_officers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL, -- Denormalized
  user_team VARCHAR(100) NOT NULL, -- Denormalized untuk filter
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Hindari duplikat: satu user hanya bisa jadi petugas 1x per kegiatan
  UNIQUE(activity_id, user_id)
);

-- Indexes untuk performa query
CREATE INDEX idx_activity_officers_activity_id ON activity_officers(activity_id);
CREATE INDEX idx_activity_officers_user_id ON activity_officers(user_id);
CREATE INDEX idx_activity_officers_user_team ON activity_officers(user_team);

COMMENT ON TABLE activity_officers IS 'Petugas pelaksana kegiatan (bisa banyak, lintas tim)';
COMMENT ON COLUMN activities.actor_id IS 'PIC/Penanggung Jawab (1 orang, bisa lintas tim)';

-- ============================================
-- Function: Auto-update status berdasarkan tanggal
-- Called by cron job atau bisa dipanggil manual
-- ============================================
CREATE OR REPLACE FUNCTION auto_update_activity_status()
RETURNS void AS $$
BEGIN
  -- Update ke 'active' jika sudah melewati start_date tapi belum deadline
  UPDATE activities
  SET status = 'active'
  WHERE start_date <= NOW()
    AND deadline >= NOW()
    AND status = 'pending';

  -- Update ke 'overdue' jika melewati deadline dan belum completed
  UPDATE activities
  SET status = 'overdue'
  WHERE deadline < NOW()
    AND status NOT IN ('completed', 'overdue');

  -- Log hasil
  RAISE NOTICE 'Auto-update status completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_update_activity_status IS 'Auto-update status: pending → active → overdue berdasarkan tanggal';

-- ============================================
-- Trigger: Auto-update status saat INSERT/UPDATE
-- Otomatis set status yang tepat saat create/update kegiatan
-- ============================================
CREATE OR REPLACE FUNCTION trigger_auto_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Hitung status otomatis dari tanggal
  IF NEW.start_date > NOW() THEN
    NEW.status := 'pending';
  ELSIF NEW.deadline < NOW() AND NEW.status != 'completed' THEN
    NEW.status := 'overdue';
  ELSIF NEW.start_date <= NOW() AND NEW.deadline >= NOW() THEN
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada activities
DROP TRIGGER IF EXISTS auto_status_on_activities ON activities;
CREATE TRIGGER auto_status_on_activities
  BEFORE INSERT OR UPDATE OF start_date, deadline
  ON activities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_status();

COMMENT ON TRIGGER auto_status_on_activities ON activities IS 'Auto-set status saat insert/update tanggal';

-- ============================================
-- View: activities_with_officers
-- Aggregasi kegiatan dengan daftar petugas
-- ============================================
CREATE OR REPLACE VIEW activities_with_officers AS
SELECT
  a.*,
  -- PIC info
  u_actor.name as actor_name_full,
  u_actor.team as actor_team,
  u_actor.whatsapp as actor_whatsapp,
  -- Aggregasi petugas
  COUNT(DISTINCT ao.user_id) as officers_count,
  STRING_AGG(DISTINCT ao.user_name, ', ' ORDER BY ao.user_name) as officers_names,
  ARRAY_AGG(DISTINCT ao.user_team) FILTER (WHERE ao.user_team IS NOT NULL) as officers_teams
FROM activities a
LEFT JOIN users u_actor ON a.actor_id = u_actor.id
LEFT JOIN activity_officers ao ON a.id = ao.activity_id
GROUP BY a.id, u_actor.name, u_actor.team, u_actor.whatsapp;

COMMENT ON VIEW activities_with_officers IS 'View kegiatan dengan PIC dan agregasi petugas';

-- ============================================
-- Sample Data Update
-- ============================================

-- Contoh: Tambah petugas untuk kegiatan existing (jika ada)
-- INSERT INTO activity_officers (activity_id, user_id, user_name, user_team)
-- SELECT
--   a.id,
--   u.id,
--   u.name,
--   u.team
-- FROM activities a
-- CROSS JOIN users u
-- WHERE a.title = 'Sakernas'
-- AND u.team IN ('Statistik Sosial', 'IPDS')
-- LIMIT 5;
