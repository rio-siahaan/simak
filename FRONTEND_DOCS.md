# 📚 Dokumentasi Frontend SIMAK

> **Sistem Informasi dan Manajemen Administrasi Kegiatan**  
> BPS Kabupaten Flores Timur

## 📋 Daftar Isi

- [Overview](#overview)
- [Teknologi Stack](#teknologi-stack)
- [Struktur Halaman](#struktur-halaman)
- [Fitur Per Modul](#fitur-per-modul)
- [Integrasi Backend](#integrasi-backend)
- [Roadmap](#roadmap)

---

## 🎯 Overview

SIMAK adalah aplikasi web untuk mengelola koordinasi kegiatan lintas tim di BPS Kabupaten Flores Timur. Aplikasi ini dirancang untuk:

- **Mengurangi tumpang tindih agenda** antar tim
- **Mencegah keterlambatan administrasi** dengan sistem notifikasi
- **Meningkatkan transparansi** koordinasi kegiatan
- **Memudahkan rekap & pelaporan** kinerja tim

**Target Pengguna:**
- Admin: mengelola kegiatan, pengguna, dan sistem
- Aktor/PIC: menerima notifikasi dan upload bukti dukung

---

## 🛠️ Teknologi Stack

### Framework & Library

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Next.js** | 16.3.0 | React framework dengan App Router |
| **React** | 19.2.8 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling utility-first |
| **react-big-calendar** | Latest | Kalender interaktif |
| **date-fns** | Latest | Manipulasi tanggal |
| **Lucide React** | 1.31.0 | Icon library |
| **Framer Motion** | 13.0.0 | Animasi (opsional) |

### Backend (Upcoming)

- **Supabase**: Database PostgreSQL + Auth + Storage
- **WhatsApp API**: Fonnte/Wablas untuk notifikasi

---

## 📁 Struktur Halaman

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard Admin
│   │   ├── kalender/
│   │   │   ├── page.tsx          # Kalender Kegiatan (react-big-calendar)
│   │   │   └── tambah/
│   │   │       └── page.tsx      # Form Tambah Kegiatan
│   │   ├── kegiatan/
│   │   │   └── page.tsx          # Daftar Kegiatan (tabel)
│   │   ├── pengguna/
│   │   │   ├── page.tsx          # Manajemen Pengguna
│   │   │   ├── tambah/
│   │   │   │   └── page.tsx      # Form Tambah Pengguna
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx  # Form Edit Pengguna
│   │   ├── laporan/
│   │   │   └── page.tsx          # Rekap & Laporan
│   │   ├── profil/
│   │   │   └── page.tsx          # Profil Pengguna
│   │   └── layout.tsx            # Admin Layout (with Sidebar)
│   ├── layout.tsx                # Root Layout
│   └── page.tsx                  # Landing Page
├── components/
│   └── layout/
│       └── sidebar.tsx           # Sidebar Navigation
├── types/
│   └── index.ts                  # TypeScript Interfaces (Supabase Schema)
└── lib/
    └── utils.ts                  # Utility functions
```

---

## 🎨 Fitur Per Modul

### 1. Dashboard Admin (`/admin/dashboard`)

**Tujuan:** Overview cepat status kegiatan dan performa tim

**Fitur:**
- ✅ **Kartu Statistik** (4 cards):
  - Kegiatan Aktif
  - Terlambat (merah)
  - Jatuh Tempo ≤2 Hari (amber)
  - Notifikasi Gagal
- ✅ **Perlu Perhatian**: daftar kegiatan prioritas dengan badge status
- ✅ **Kalender Minggu Ini**: mini calendar 7 hari dengan indikator tim
- ✅ **Kepatuhan Tenggat per Tim**: progress bar persentase ketepatan
- ✅ **Aktivitas Terbaru**: timeline aktivitas real-time

**Color Palette:**
- Putih: neutral/default
- Merah muda (`bg-red-50`): terlambat/alert
- Amber (`bg-amber-50`): warning/deadline dekat
- Hijau: success/on-time
- Biru: active/sedang berjalan

---

### 2. Kalender Kegiatan (`/admin/kalender`)

**Tujuan:** Visualisasi kalender kegiatan dengan filter tim

**Fitur:**
- ✅ **react-big-calendar** dengan locale Indonesia
- ✅ **Multi-view**: Bulan, Minggu, Hari, Agenda
- ✅ **Color-coded per Tim**: setiap tim punya warna unik
- ✅ **Filter dropdown** tim
- ✅ **Navigasi bulan** dengan prev/next/today buttons
- ✅ **Interactive**:
  - Klik event → detail/edit (siap wire)
  - Klik slot kosong → tambah event (siap wire)
- ✅ **Legend warna tim** di bawah kalender
- ✅ **Custom toolbar** tanpa default toolbar library

**Struktur Event:**
```typescript
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  team: string;
  teamColor: string;
  aktor?: string;
  deadline?: Date;
  status?: string;
}
```

**Mapping Warna Tim:**
| Tim | Warna | Hex |
|-----|-------|-----|
| Statistik Sosial | Biru | `#3B82F6` |
| Produksi | Orange | `#F97316` |
| Distribusi | Hijau | `#10B981` |
| IPDS | Ungu | `#8B5CF6` |
| NWAS | Merah | `#EF4444` |
| PSS | Cyan | `#06B6D4` |
| Subbag Umum | Amber | `#F59E0B` |
| Humas | Pink | `#EC4899` |

---

### 3. Tambah Kegiatan (`/admin/kalender/tambah`)

**Tujuan:** Form input kegiatan baru

**Fitur:**
- ✅ **Form fields lengkap**:
  - Nama Kegiatan (text)
  - Tim Pelaksana (dropdown)
  - Nama Aktor/PIC (text)
  - Nomor WhatsApp Aktor (tel, format +62)
  - Tanggal Mulai (date)
  - Tanggal Deadline (date)
  - Status (dropdown: Belum Dimulai, Sedang Berjalan, Selesai, Tertunda)
  - Catatan (textarea, opsional)
- ✅ **Validasi form** HTML5 required
- ✅ **Breadcrumb navigation**
- ✅ **Tombol Simpan & Batal**

**Siap Integrasi:**
- POST ke Supabase `activities` table
- Trigger notifikasi WhatsApp saat submit

---

### 4. Daftar Kegiatan (`/admin/kegiatan`)

**Tujuan:** Tabel daftar kegiatan dengan filter & search

**Fitur:**
- ✅ **Search bar** nama kegiatan
- ✅ **Filter panel** (Tim + Status)
- ✅ **Stats Summary** (4 cards):
  - Total Kegiatan
  - Sedang Berjalan
  - Selesai
  - Terlambat
- ✅ **Tabel lengkap**:
  - Kegiatan (title + start date)
  - Tim (badge warna)
  - Aktor
  - Deadline (dengan countdown hari)
  - Progress (progress bar %)
  - Status (badge dengan icon)
  - Aksi (View/Edit/Delete)
- ✅ **Dynamic countdown**: "Lewat X hari", "Hari ini", "X hari lagi"
- ✅ **Color-coded progress bar**:
  - 100% = hijau
  - ≥50% = biru
  - <50% = amber

**Status Badge:**
- Belum Dimulai: abu-abu + Clock icon
- Sedang Berjalan: biru + Clock icon
- Selesai: hijau + CheckCircle2 icon
- Terlambat: merah + AlertCircle icon
- Tertunda: kuning + XCircle icon

---

### 5. Manajemen Pengguna (`/admin/pengguna`)

**Tujuan:** CRUD pengguna (Admin & Aktor)

**Fitur:**
- ✅ **Search bar** nama pengguna
- ✅ **Filter dropdown** tim
- ✅ **Tabel pengguna**:
  - Nama
  - Tim
  - No. WhatsApp
  - Role (badge: Admin=biru, Aktor=hijau)
  - Aksi (Edit/Hapus)
- ✅ **Tombol "+ Tambah Pengguna"**

**Sub-halaman:**

#### Tambah Pengguna (`/admin/pengguna/tambah`)
- Form: Nama Lengkap, Tim, Role, Nomor WhatsApp
- Prefix +62 tetap untuk WhatsApp
- Validasi pattern hanya angka

#### Edit Pengguna (`/admin/pengguna/[id]/edit`)
- Form ter-populate dengan data existing
- **Danger Zone** untuk hapus pengguna
- Konfirmasi dialog sebelum hapus
- Loading state saat fetch data

---

### 6. Rekap & Laporan (`/admin/laporan`)

**Tujuan:** Visualisasi performa & statistik sistem

**Fitur:**
- ✅ **Filter periode**: Bulan Ini, 3 Bulan, 6 Bulan, Tahun Ini, Custom
- ✅ **Export buttons**: Excel (hijau) + PDF (merah)
- ✅ **4 Tab Report**:

#### Tab 1: Overview
- **Summary Cards** (4):
  - Total Kegiatan tahun ini
  - Selesai (% dari total)
  - Tepat Waktu (% dari total)
  - Tingkat Kepatuhan (%)
- **Tren Bulanan**: tabel 8 bulan dengan progress bar kepatuhan

#### Tab 2: Per Tim
- Tabel performa 8 tim:
  - Total Kegiatan
  - Selesai
  - Tepat Waktu
  - Tingkat Kepatuhan (progress bar + %)

#### Tab 3: Per Aktor
- **Top 5 Aktor Terbaik**:
  - Ranking badge (#1-#5)
  - Nama + Tim
  - Kegiatan Selesai
  - Tepat Waktu
  - % Kepatuhan

#### Tab 4: Notifikasi
- **Stats Cards** (3):
  - Total Notifikasi
  - Berhasil Terkirim (hijau, % success rate)
  - Gagal (merah, % failure rate)
- **Breakdown Per Tipe**:
  - Notifikasi Kegiatan Baru
  - Pengingat H-1

---

### 7. Profil Pengguna (`/admin/profil`)

**Tujuan:** Kelola profil & keamanan akun

**Fitur:**
- ✅ **Layout 2 kolom**:

#### Kolom Kiri:
- Avatar dengan initial
- Nama + Jabatan
- Role badge (Admin/Aktor)
- Statistik:
  - Tanggal Bergabung
  - Login Terakhir
  - Total Aktivitas

#### Kolom Kanan:
- **Informasi Profil** (editable):
  - Nama Lengkap
  - Email
  - Nomor WhatsApp
  - Tim (dropdown)
  - Jabatan
  - Mode Edit: tombol Simpan/Batal
- **Riwayat Aktivitas Terbaru**: timeline 5 aktivitas terakhir
- **Keamanan**:
  - Ubah Password (button)
  - Riwayat Login (button)

---

### 8. Sidebar Navigation

**Fitur:**
- ✅ **Logo SIMAK** di atas
- ✅ **6 Menu Items** dengan icon:
  1. Dashboard Admin
  2. Kalender Kegiatan
  3. Daftar Kegiatan
  4. Manajemen Pengguna
  5. Rekap & Laporan
  6. Profil Pengguna
- ✅ **Active state**: highlight item sesuai pathname
- ✅ **Hover state**: abu-abu terang
- ✅ **Fixed width**: 216px
- ✅ **Background**: abu-abu muda (#F9FAFB)

---

## 🔌 Integrasi Backend (Ready)

### TypeScript Interfaces (`src/types/index.ts`)

Schema siap Supabase sudah dibuat dengan interface lengkap:

#### Tabel Database:

**1. `users`**
```typescript
interface User {
  id: string;
  name: string;
  team: TeamType;
  whatsapp: string;
  role: UserRole; // "Admin" | "Aktor"
  created_at?: string;
  updated_at?: string;
}
```

**2. `activities`**
```typescript
interface Activity {
  id: string;
  title: string;
  team: TeamType;
  actor_id?: string; // FK ke users
  actor_name: string;
  actor_whatsapp: string;
  start_date: string; // ISO
  end_date: string; // ISO
  deadline?: string; // ISO
  status: ActivityStatus; // pending|active|completed|delayed|overdue
  notes?: string;
  attachment_urls?: string[];
  notification_sent?: boolean;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string; // Admin ID
}
```

**3. `notifications`**
```typescript
interface Notification {
  id: string;
  activity_id: string; // FK ke activities
  user_id: string; // FK ke users
  type: NotificationType; // activity_created|reminder_h1|overdue
  sent_at: string;
  status: NotificationStatus; // pending|sent|failed
  whatsapp_message_id?: string;
  error_message?: string;
}
```

**4. `attachments`**
```typescript
interface Attachment {
  id: string;
  activity_id: string;
  file_name: string;
  file_url: string; // Supabase Storage URL
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}
```

### Langkah Setup Supabase:

1. **Install dependency:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Buat project di Supabase.com**

3. **Jalankan SQL untuk create tables:**
   ```sql
   -- Lihat schema di src/types/index.ts
   -- Buat tabel users, activities, notifications, attachments
   -- Setup RLS policies
   -- Buat relasi FK
   ```

4. **Setup client:**
   ```typescript
   // src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'
   
   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
   ```

5. **Implementasi CRUD functions:**
   - `src/lib/activities.ts` - CRUD activities
   - `src/lib/users.ts` - CRUD users
   - `src/lib/notifications.ts` - Send & log notifications

---

## 🚀 Roadmap

### ✅ Phase 1: Frontend (SELESAI)
- [x] Setup Next.js + TypeScript + Tailwind
- [x] Dashboard Admin
- [x] Kalender Kegiatan (react-big-calendar)
- [x] Form Tambah Kegiatan
- [x] Daftar Kegiatan
- [x] Manajemen Pengguna (CRUD)
- [x] Rekap & Laporan
- [x] Profil Pengguna
- [x] Sidebar Navigation
- [x] TypeScript Interfaces (Schema)

### ⏳ Phase 2: Backend & Auth
- [ ] Setup Supabase project
- [ ] Create database tables + RLS
- [ ] Implement Supabase client
- [ ] Auth: Login/Logout/Session
- [ ] CRUD API integration
- [ ] File upload (bukti dukung) ke Supabase Storage

### ⏳ Phase 3: Notifikasi WhatsApp
- [ ] Pilih provider (Fonnte/Wablas)
- [ ] Setup API key
- [ ] Implement send notification function
- [ ] Trigger notifikasi saat create activity
- [ ] Scheduled job untuk reminder H-1
- [ ] Log notifikasi ke database

### ⏳ Phase 4: Advanced Features
- [ ] Real-time updates (Supabase subscriptions)
- [ ] Export Excel/PDF (library: xlsx, jspdf)
- [ ] Dashboard chart visualization (recharts/chart.js)
- [ ] Email notifications (fallback WhatsApp)
- [ ] Mobile responsive optimization
- [ ] PWA offline mode

### ⏳ Phase 5: Testing & Deploy
- [ ] Unit testing (Vitest)
- [ ] E2E testing (Playwright)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Deploy ke Vercel/Netlify
- [ ] Custom domain + SSL

---

## 📊 Keunggulan Arsitektur

### 1. **Separation of Concerns**
- Frontend: Next.js (presentasi)
- Backend: Supabase (data + auth)
- Notifikasi: WhatsApp API (komunikasi)

### 2. **Type Safety**
- TypeScript interfaces sebagai contract
- Compile-time error detection
- Auto-completion IDE

### 3. **Scalability**
- Supabase auto-scale database
- Next.js edge caching
- Serverless functions

### 4. **Developer Experience**
- Hot reload Next.js
- Component-based architecture
- Utility-first CSS (Tailwind)

### 5. **User Experience**
- Interactive calendar
- Real-time updates
- Responsive design
- Fast page loads

---

## 🎨 Design System

### Color Palette

| Warna | Use Case | Tailwind Class |
|-------|----------|----------------|
| Gray 900 | Text primary, buttons | `text-gray-900`, `bg-gray-900` |
| Gray 700 | Text secondary | `text-gray-700` |
| Gray 600 | Text muted | `text-gray-600` |
| Gray 200 | Borders | `border-gray-200` |
| Gray 50 | Background subtle | `bg-gray-50` |
| Blue | Active, info | `bg-blue-100`, `text-blue-700` |
| Green | Success, completed | `bg-green-100`, `text-green-700` |
| Red | Error, overdue | `bg-red-100`, `text-red-700` |
| Amber | Warning, deadline soon | `bg-amber-100`, `text-amber-700` |
| Purple | IPDS team | `bg-purple-100`, `text-purple-700` |

### Typography

- **Font**: System font stack (inherit)
- **Heading 1**: `text-3xl font-bold` (30px)
- **Heading 2**: `text-xl font-semibold` (20px)
- **Body**: `text-sm` (14px)
- **Small**: `text-xs` (12px)

### Components

- **Buttons**: `rounded-lg`, `px-5 py-2.5`, `font-medium`
- **Cards**: `border border-gray-200 rounded-lg p-6`
- **Inputs**: `border border-gray-300 rounded-lg px-4 py-2.5`
- **Badges**: `rounded-full px-2.5 py-0.5 text-xs font-medium`

---

## 📝 Konvensi Kode

### File Naming
- **Pages**: `page.tsx` (Next.js convention)
- **Components**: `PascalCase.tsx` (e.g., `Sidebar.tsx`)
- **Utils**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: `index.ts` dalam folder `types/`

### Variable Naming
- **React State**: `camelCase` (e.g., `selectedTeam`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `SAMPLE_USERS`)
- **Functions**: `camelCase` (e.g., `handleSubmit`)
- **Interfaces**: `PascalCase` (e.g., `CalendarEvent`)

### Import Order
1. React & Next.js
2. External libraries
3. Internal components
4. Types
5. Styles/CSS

---

## 🤝 Kontribusi

### Branch Strategy
- `main`: production-ready code
- `dev`: development branch
- `feature/*`: fitur baru
- `fix/*`: bug fixes

### Commit Messages
Format: `<type>: <description>`

**Types:**
- `feat`: fitur baru
- `fix`: bug fix
- `docs`: dokumentasi
- `style`: formatting
- `refactor`: refactoring
- `test`: testing
- `chore`: maintenance

**Contoh:**
```
feat: add calendar view with react-big-calendar
fix: incorrect deadline calculation in activity list
docs: update README with Supabase setup guide
```

---

## 📞 Kontak

**Developer:** Rio Manuppak Siahaan  
**Role:** Pranata Komputer Ahli  
**Tim:** IPDS & Tim Umum  
**Instansi:** BPS Kabupaten Flores Timur

**Project Context:** Aktualisasi Latsar CPNS 2025

---

## 📄 Lisensi

Internal use - BPS Kabupaten Flores Timur

---

**Last Updated:** 18 Agustus 2026  
**Version:** 1.0.0 (Frontend Complete)
