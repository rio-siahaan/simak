# Setup Supabase untuk SIMAK

Panduan lengkap untuk mengintegrasikan Supabase dengan SIMAK BPS Kabupaten Flores Timur.

## 📋 Prasyarat

- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- Node.js dan npm sudah terinstal
- Akses ke project SIMAK

## 🚀 Langkah-langkah Setup

### 1. Buat Project Supabase

1. Kunjungi [supabase.com](https://supabase.com) dan login/daftar
2. Klik **"New Project"**
3. Isi detail project:
   - **Name**: `simak-flotim` (atau nama bebas)
   - **Database Password**: Buat password kuat (SIMPAN BAIK-BAIK)
   - **Region**: Pilih **Southeast Asia (Singapore)** untuk performa terbaik
4. Klik **"Create new project"** dan tunggu ~2 menit hingga selesai

### 2. Dapatkan API Credentials

1. Setelah project dibuat, buka **Settings** → **API**
2. Copy dua nilai berikut:
   - **Project URL** (contoh: `https://xxxxxx.supabase.co`)
   - **anon public key** (string panjang dimulai dengan `eyJ...`)

### 3. Setup Environment Variables

1. Buka file `.env.local` di root project SIMAK
2. Ganti placeholder dengan credentials Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key
```

**⚠️ PENTING:** 
- Jangan commit file `.env.local` ke Git (sudah ada di `.gitignore`)
- Jangan share anon key di tempat publik

### 4. Buat Database Schema

1. Di dashboard Supabase, klik **SQL Editor** di sidebar kiri
2. Klik **"New query"**
3. Copy seluruh isi file `supabase-schema.sql` yang ada di root project
4. Paste ke SQL Editor
5. Klik **"Run"** (tombol play ▶️ di kanan atas)
6. Tunggu hingga muncul notifikasi **"Success. No rows returned"**

### 5. Verifikasi Tabel

1. Klik **Table Editor** di sidebar
2. Pastikan tiga tabel berhasil dibuat:
   - ✅ `users`
   - ✅ `activities`
   - ✅ `notifications`
3. Buka tabel `users`, seharusnya sudah ada 4 sample data

### 6. Testing API Routes

1. Jalankan development server:
```bash
npm run dev
```

2. Test API dengan Postman atau curl:

**Get All Users:**
```bash
curl http://localhost:3000/api/users
```

**Get All Activities:**
```bash
curl http://localhost:3000/api/activities
```

**Create New User:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "team": "IPDS",
    "whatsapp": "+6281234567890",
    "role": "Aktor"
  }'
```

## 📁 Struktur API Routes

### Users
- `GET /api/users` - Ambil semua users (support query: ?team=IPDS&search=Rio)
- `POST /api/users` - Tambah user baru
- `GET /api/users/[id]` - Detail user berdasarkan ID
- `PATCH /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Hapus user

### Activities
- `GET /api/activities` - Ambil semua kegiatan (support query: ?team=IPDS&status=active&search=Sakernas)
- `POST /api/activities` - Tambah kegiatan baru
- `GET /api/activities/[id]` - Detail kegiatan berdasarkan ID
- `PATCH /api/activities/[id]` - Update kegiatan
- `DELETE /api/activities/[id]` - Hapus kegiatan

### Notifications
- `GET /api/notifications` - Ambil log notifikasi (support query: ?activity_id=xxx&user_id=yyy&status=sent)
- `POST /api/notifications` - Buat notifikasi baru (manual trigger)

## 🔧 Troubleshooting

### Error: "Supabase URL dan Anon Key harus diset"
- Pastikan `.env.local` sudah dibuat dan berisi credentials yang benar
- Restart development server (`npm run dev`)

### Error: "relation does not exist"
- Schema belum dibuat. Jalankan ulang SQL schema di SQL Editor
- Pastikan tidak ada error saat run SQL

### Error: "insert violates foreign key constraint"
- Pastikan `actor_id` yang digunakan benar-benar ada di tabel `users`
- Check dengan query: `SELECT id, name FROM users;`

### API mengembalikan data kosong
- Cek apakah ada data di Supabase Table Editor
- Verifikasi RLS (Row Level Security) policies sudah diset dengan benar

## 🔐 Security Notes

1. **Anon Key**: Aman digunakan di frontend karena dilindungi RLS policies
2. **Service Role Key**: JANGAN PERNAH expose di frontend/client-side code
3. **RLS Policies**: Sudah diaktifkan untuk semua tabel, adjust sesuai kebutuhan auth

## 📊 Database Schema Summary

### Table: users
```
- id (UUID, PK)
- name (VARCHAR)
- team (VARCHAR) → IPDS, Statistik Sosial, Produksi, dll
- whatsapp (VARCHAR) → format +62xxx
- role (VARCHAR) → Admin | Aktor
- created_at, updated_at (TIMESTAMPTZ)
```

### Table: activities
```
- id (UUID, PK)
- title (VARCHAR)
- team (VARCHAR)
- team_color (VARCHAR) → hex color
- actor_id (UUID, FK → users.id)
- actor_name (VARCHAR) → denormalized
- start_date (TIMESTAMPTZ)
- deadline (TIMESTAMPTZ)
- status (VARCHAR) → pending | active | completed | overdue | delayed
- progress (INTEGER 0-100)
- description (TEXT)
- evidence_url (TEXT) → link Google Drive
- created_at, updated_at (TIMESTAMPTZ)
```

### Table: notifications
```
- id (UUID, PK)
- activity_id (UUID, FK → activities.id)
- user_id (UUID, FK → users.id)
- type (VARCHAR) → created | reminder_h1 | overdue
- status (VARCHAR) → pending | sent | failed
- sent_at (TIMESTAMPTZ)
- error_message (TEXT)
- created_at (TIMESTAMPTZ)
```

## 🔄 Next Steps

Setelah setup Supabase selesai, langkah selanjutnya:

1. ✅ Update frontend pages untuk fetch data dari API (bukan hardcoded)
2. ✅ Implementasi form tambah/edit yang terhubung ke API
3. ✅ Setup WhatsApp API integration (Fonnte/Wablas)
4. ✅ Buat cron job untuk reminder H-1 dan auto-update status overdue
5. ✅ Implementasi upload bukti dukung ke Google Drive

## 📞 Support

Jika ada kendala atau pertanyaan:
- Dokumentasi Supabase: [supabase.com/docs](https://supabase.com/docs)
- Kontak Rio Manuppak S. (Pranata Komputer - Tim IPDS BPS Flores Timur)
