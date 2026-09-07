-- ============================================
-- SIMAK Schema Update: Tambah log_data untuk notifikasi WhatsApp
-- Tanggal: 2 September 2026
-- ============================================

-- Tambah kolom log_data ke tabel notifications
-- Untuk menyimpan detail response dari Fonnte (message_id, duration, phone, dll)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS log_data JSONB;

-- Index untuk query log_data
CREATE INDEX IF NOT EXISTS idx_notifications_log_data ON notifications USING GIN (log_data);

-- Update comment
COMMENT ON COLUMN notifications.log_data IS 'Detail response dari Fonnte API: {message_id, duration_ms, phone, timestamp, error}';

-- ============================================
-- Sample query untuk dashboard
-- ============================================

-- Statistik pengiriman per hari
-- SELECT
--   DATE(created_at) as tanggal,
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE status = 'sent') as terkirim,
--   COUNT(*) FILTER (WHERE status = 'failed') as gagal,
--   AVG((log_data->>'duration_ms')::int) as avg_duration_ms
-- FROM notifications
-- WHERE created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY tanggal DESC;

-- Detail error yang paling sering
-- SELECT
--   error_message,
--   COUNT(*) as jumlah
-- FROM notifications
-- WHERE status = 'failed'
--   AND error_message IS NOT NULL
-- GROUP BY error_message
-- ORDER BY jumlah DESC;