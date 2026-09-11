# Dokumentasi Fitur Notifikasi WhatsApp SIMAK

## Ringkasan Fitur

Sistem notifikasi WhatsApp telah diintegrasikan dengan SIMAK untuk mengirim notifikasi otomatis ke aktor saat kegiatan baru ditambahkan. Notifikasi menyertakan link khusus untuk aktor mengisi bukti dukung kegiatan.

## Alur Kerja

```
1. Admin tambah kegiatan baru
   ↓
2. Sistem kirim notifikasi WhatsApp ke semua aktor
   - Template: "created"
   - Berisi: detail kegiatan + link form bukti dukung
   ↓
3. Aktor klik link → Halaman form upload bukti dukung
   ↓
4. Aktor isi link Google Drive → Submit
   ↓
5. Data tersimpan di database (TIDAK ada notifikasi tambahan)
```

**Keuntungan**: Hanya 1 notifikasi WhatsApp per kegiatan → hemat kuota Fonnte

## File yang Dibuat/Dimodifikasi

### 1. File Baru

- **`src/lib/notification-templates.ts`** — Template notifikasi yang bisa diubah
- **`src/app/bukti/[activityId]/[actorId]/page.tsx`** — Halaman form upload bukti dukung
- **`src/app/api/activities/[id]/actors/route.ts`** — API verifikasi aktor

### 2. File Dimodifikasi

- **`src/lib/whatsapp.ts`** — Refactor untuk menggunakan template eksternal
- **`src/app/api/activities/[id]/route.ts`** — Hapus notifikasi evidence_uploaded
- **`src/lib/supabase.ts`** — Tambah tipe notifikasi `evidence_uploaded`
- **`src/lib/constants.ts`** — Tambah konstanta notifikasi baru
- **`supabase-schema.sql`** — Update constraint tipe notifikasi
- **`.env.example`** & **`.env.local`** — Tambah `NEXT_PUBLIC_APP_URL`

## Cara Mengubah Template Notifikasi

Template notifikasi ada di: **`src/lib/notification-templates.ts`**

### Langkah Mengubah:

1. Buka file `src/lib/notification-templates.ts`
2. Edit bagian `NOTIFICATION_TEMPLATES`
3. Gunakan placeholder untuk data dinamis:
   - `{actorName}` — Nama pelaksana
   - `{title}` — Judul kegiatan
   - `{team}` — Nama tim
   - `{startDateFormatted}` — Tanggal mulai (format Indonesia)
   - `{deadlineFormatted}` — Tanggal deadline (format Indonesia)
   - `{description}` — Deskripsi kegiatan
   - `{evidenceFormUrl}` — Link form bukti dukung (auto-generate)
4. Simpan file
5. Restart aplikasi: `npm run dev`

### Contoh Template "created":

```javascript
created: `🔔 *SIMAK - Kegiatan Baru Ditugaskan*

Halo *{actorName}*,

Anda ditugaskan sebagai pelaksana kegiatan berikut:

📋 *{title}*
📍 Tim: {team}
📅 Periode: {startDateFormatted} s/d {deadlineFormatted}
{description}

📌 *Tindakan yang diperlukan:*
1. Laksanakan kegiatan sesuai jadwal
2. Upload bukti dukung melalui link berikut:
   {evidenceFormUrl}
3. Pastikan selesai sebelum deadline

_Link di atas adalah khusus untuk Anda. Jangan bagikan ke pihak lain._

_Pesan ini dikirim otomatis oleh SIMAK_
_BPS Kabupaten Flores Timur_`,
```

## Halaman Upload Bukti Dukung

**URL Format**: `http://localhost:3000/bukti/{activityId}/{actorId}`

### Fitur:
- Validasi aktor (hanya pelaksana resmi yang bisa akses)
- Tampilkan detail kegiatan
- Form input link Google Drive / cloud storage
- Validasi URL (harus http:// atau https://)
- Submit langsung update database

### Keamanan:
- Link bersifat personal (pakai actorId unik)
- Verifikasi relasi aktor-kegiatan via API
- Tidak ada notifikasi tambahan (hemat kuota)

## Environment Variables

Tambahkan di **`.env.local`**:

```bash
# Base URL aplikasi (untuk generate link form bukti dukung)
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production (ganti dengan domain Anda)
# NEXT_PUBLIC_APP_URL=https://simak-flotim.com
```

## Testing

### 1. Test Notifikasi WhatsApp

1. Pastikan `WHATSAPP_API_KEY` sudah diset di `.env.local`
2. Tambah kegiatan baru via halaman `/admin/kalender/tambah`
3. Pilih aktor pelaksana
4. Submit
5. Cek WhatsApp aktor → harus ada notifikasi dengan link form bukti dukung

### 2. Test Upload Bukti Dukung

1. Salin link dari notifikasi WhatsApp
2. Buka di browser
3. Harus muncul halaman form upload
4. Isi link Google Drive
5. Submit
6. Data harus tersimpan di database (kolom `evidence_url`)
7. **TIDAK ada** notifikasi WhatsApp tambahan

## Catatan Penting

### Hemat Kuota Fonnte

- ✅ **1 notifikasi** saat kegiatan dibuat (berisi link form)
- ❌ **TIDAK ada** notifikasi saat aktor upload bukti dukung
- Ini mengurangi 50% pemakaian kuota WhatsApp

### Link Form Bukti Dukung

Link format: `/bukti/{activityId}/{actorId}`

- `activityId` — UUID kegiatan
- `actorId` — UUID user aktor
- Link bersifat personal & aman
- Verifikasi otomatis via API

### Template Notifikasi Lain

Selain "created", ada template lain yang bisa digunakan nanti:

- **`reminder_h1`** — Pengingat H-1 deadline (untuk cron job)
- **`overdue`** — Notifikasi terlambat (untuk cron job)
- **`evidence_uploaded`** — Konfirmasi (TIDAK dipakai, untuk hemat kuota)

## Troubleshooting

### Notifikasi tidak terkirim?
- Cek `WHATSAPP_API_KEY` di `.env.local`
- Cek format nomor WhatsApp di database (harus +628xxx atau 08xxx)
- Lihat log di console: `[WhatsApp] Notifikasi created: ...`

### Link form tidak berfungsi?
- Cek `NEXT_PUBLIC_APP_URL` di `.env.local`
- Pastikan sesuai dengan environment (dev: localhost, prod: domain real)

### Aktor tidak bisa akses halaman?
- Pastikan user adalah PIC (`activities.actor_id`) ATAU terdaftar sebagai petugas
  di junction table `activity_officers` kegiatan tersebut (bukan tabel legacy
  `activity_actors`, yang tidak pernah diisi)
- Cek API `/api/activities/{id}/actors?actor_id={actorId}` harus return data

## Roadmap Selanjutnya

Fitur yang bisa ditambahkan:

1. ✅ Notifikasi saat kegiatan dibuat (SUDAH)
2. ⏰ Cron job reminder H-1 deadline
3. ⚠️ Cron job notifikasi kegiatan overdue
4. 📊 Dashboard monitoring notifikasi (sent/failed)
5. 🔄 Retry mechanism untuk notifikasi gagal

---

**Dibuat**: 2 September 2026  
**Pengembang**: Rio Manuppak Siahaan (Pranata Komputer Ahli)  
**Tim**: IPDS & Tim Umum — BPS Kabupaten Flores Timur
