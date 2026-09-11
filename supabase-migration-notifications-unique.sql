-- ============================================
-- SIMAK Schema Update: Perbaikan tabel notifications
-- Tanggal: 11 September 2026
-- ============================================

-- 1) UNIQUE CONSTRAINT untuk upsert log
-- notifyActor() (src/lib/whatsapp.ts) menyimpan log memakai
-- `upsert(... onConflict: 'activity_id,user_id,type')`.
-- Tanpa unique constraint yang menutupi ketiga kolom itu, Postgres
-- melempar error "ON CONFLICT ... does not match any unique constraint"
-- SETIAP kali -> baris tidak pernah tercatat di tabel notifications
-- padahal WhatsApp sudah terkirim.
--
-- Index ini harus dijalankan SEKALI di Supabase. Pastikan tidak ada
-- baris duplikat (activity_id, user_id, type) sebelum dijalankan:
--
--   SELECT activity_id, user_id, type, COUNT(*)
--   FROM notifications
--   GROUP BY 1,2,3
--   HAVING COUNT(*) > 1;
--
-- (Jika muncul, hapus duplikatnya dulu, mis. sisakan baris terlama:
--   DELETE FROM notifications a
--   USING notifications b
--   WHERE a.id > b.id
--     AND a.activity_id = b.activity_id
--     AND a.user_id     = b.user_id
--     AND a.type        = b.type;)
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_activity_user_type
  ON notifications (activity_id, user_id, type);

-- 2) CHECK constraint TIPE
-- Kode mengirim notifikasi type 'completed' (saat status kegiatan diubah jadi
-- selesai, lihat src/app/api/activities/[id]/route.ts), tapi CHECK constraint
-- asli di supabase-schema.sql TIDAK memasukkan 'completed'. Akibatnya insert/
-- upsert tipe itu selalu gagal ("violates check constraint").
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check,
  ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('created', 'reminder_h1', 'overdue', 'evidence_uploaded', 'completed'));