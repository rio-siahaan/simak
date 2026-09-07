-- ============================================
-- SIMAK Migration: Autentikasi NIP + Role
-- Tanggal: 2 September 2026
-- ============================================

-- 1. Tambah kolom nip ke tabel users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS nip VARCHAR(20) UNIQUE;

-- Index untuk lookup cepat by NIP
CREATE INDEX IF NOT EXISTS idx_users_nip ON users(nip);

-- Comment
COMMENT ON COLUMN users.nip IS 'Nomor Induk Pegawai untuk autentikasi login';

-- 2. Update sample data dengan NIP (opsional)
-- UPDATE users SET nip = '198001012005011001' WHERE name = 'Benedikta Bewa Da Gomez';
-- UPDATE users SET nip = '198502152008012002' WHERE name = 'Fridolinda Seruya Nakluy A.Md';

-- ============================================
-- 3. Tabel sessions untuk session-based auth
-- (Alternatif: pakai Supabase Auth, tapi untuk simpakita gunakan session manual)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash dari token
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

COMMENT ON TABLE user_sessions IS 'Session login untuk auth NIP + role';

-- ============================================
-- 4. Function untuk cleanup session expired
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Function untuk verifikasi login NIP + Role
-- ============================================
CREATE OR REPLACE FUNCTION verify_login(p_nip VARCHAR, p_role VARCHAR)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  team VARCHAR,
  whatsapp VARCHAR,
  role VARCHAR,
  nip VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.team, u.whatsapp, u.role, u.nip
  FROM users u
  WHERE u.nip = p_nip
    AND u.role = p_role;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. Function untuk create session
-- ============================================
CREATE OR REPLACE FUNCTION create_session(
  p_user_id UUID,
  p_token_hash VARCHAR(64),
  p_expires_at TIMESTAMPTZ,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO user_sessions (user_id, token_hash, expires_at, user_agent, ip_address)
  VALUES (p_user_id, p_token_hash, p_expires_at, p_user_agent, p_ip_address)
  RETURNING user_sessions.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Function untuk validasi session
-- ============================================
CREATE OR REPLACE FUNCTION validate_session(p_token_hash VARCHAR(64))
RETURNS TABLE (
  user_id UUID,
  name VARCHAR,
  team VARCHAR,
  whatsapp VARCHAR,
  role VARCHAR,
  nip VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.name, u.team, u.whatsapp, u.role, u.nip, s.expires_at
  FROM user_sessions s
  JOIN users u ON u.id = s.user_id
  WHERE s.token_hash = p_token_hash
    AND s.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Function untuk delete session (logout)
-- ============================================
CREATE OR REPLACE FUNCTION delete_session(p_token_hash VARCHAR(64))
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE token_hash = p_token_hash;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample: Tambah user admin default untuk testing
-- (Jalankan setelah migrasi di atas)
-- ============================================
-- INSERT INTO users (name, team, whatsapp, role, nip)
-- VALUES
--   ('Rio Manuppak Siahaan', 'IPDS', '6281234567890', 'Admin', '198001012005011000'),
--   ('Admin Umum', 'Umum', '6281234567891', 'Admin', '198002022005011001'),
--   ('Benedikta Bewa Da Gomez', 'Statistik Sosial', '6281234567892', 'Aktor', '198003032005012002');