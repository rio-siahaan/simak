-- ============================================
-- SIMAK Migration: RLS Policies untuk user_sessions
-- Tanggal: 2 September 2026
-- ============================================

-- Enable RLS pada tabel user_sessions (jika belum)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policy: Service role bisa insert/update/delete/select semua
-- (Digunakan oleh backend API via service_role_key)
-- ============================================
CREATE POLICY "Service role full access" ON user_sessions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Policy: User bisa lihat session MILIK SENDIRI (opsional, untuk debugging)
-- ============================================
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Policy: User bisa delete session MILIK SENDIRI (logout)
-- ============================================
CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Tambah juga policy untuk tabel users (jika belum lengkap)
-- ============================================

-- Service role full access ke users
CREATE POLICY "Service role full access users" ON users
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- User bisa update profil sendiri (nama, whatsapp, dll - TAPI BUKAN role/nip)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User bisa lihat data sendiri
CREATE POLICY "Users can view own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- ============================================
-- Policy untuk activity_officers (jika tabel sudah dibuat)
-- ============================================
-- Service role full access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_officers') THEN
    EXECUTE 'CREATE POLICY "Service role full access activity_officers" ON activity_officers FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')';
  END IF;
END $$;

-- ============================================
-- Policy untuk notifications (jika belum)
-- ============================================
CREATE POLICY "Service role full access notifications" ON notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Policy untuk activities (jika belum lengkap)
-- ============================================
CREATE POLICY "Service role full access activities" ON activities
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');