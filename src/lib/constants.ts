// Constants dan referensi data untuk SIMAK

/**
 * Daftar tim di BPS Kabupaten Flores Timur
 */
export const TEAMS = [
  { id: 'all', name: 'Semua Tim', color: '' },
  { id: 'sosial', name: 'Ketua Tim Sosial', color: '#3B82F6' },
  { id: 'produksi', name: 'Ketua Tim Produksi', color: '#F97316' },
  { id: 'distribusi', name: 'Ketua Tim Distribusi', color: '#10B981' },
  { id: 'ipds', name: 'Ketua Tim IPDS', color: '#8B5CF6' },
  { id: 'nwas', name: 'Ketua Tim Nerwilis', color: '#EF4444' },
  { id: 'pss', name: 'Ketua Tim PSS', color: '#06B6D4' },
  { id: 'umum', name: 'Kepala Sub Bagian Umum', color: '#F59E0B' },
  { id: 'sakernas', name: 'Ketua Tim Sakernas', color: '#EC4899' },
] as const;

/**
 * Status kegiatan dengan konfigurasi label dan warna
 */
export const ACTIVITY_STATUS = {
  pending: {
    label: 'Belum Dimulai',
    color: 'bg-gray-100 text-gray-700',
    badgeColor: 'gray',
  },
  active: {
    label: 'Sedang Berjalan',
    color: 'bg-blue-100 text-blue-700',
    badgeColor: 'blue',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-green-100 text-green-700',
    badgeColor: 'green',
  },
} as const;

/**
 * Filter status untuk dropdown
 */
export const STATUS_FILTERS = [
  'Semua Status',
  'Belum Dimulai',
  'Sedang Berjalan',
  'Selesai',
] as const;

/**
 * Role pengguna
 */
export const USER_ROLES = ['Admin', 'Aktor'] as const;

/**
 * Tipe notifikasi
 */
export const NOTIFICATION_TYPES = {
  created: {
    label: 'Kegiatan Ditugaskan',
    description: 'Notifikasi saat kegiatan baru ditugaskan ke aktor',
  },
  completed: {
    label: 'Kegiatan Selesai',
    description: 'Notifikasi saat status kegiatan diubah menjadi selesai',
  },
} as const;

/**
 * Status notifikasi
 */
export const NOTIFICATION_STATUS = {
  pending: {
    label: 'Menunggu',
    color: 'bg-gray-100 text-gray-700',
  },
  sent: {
    label: 'Terkirim',
    color: 'bg-green-100 text-green-700',
  },
  failed: {
    label: 'Gagal',
    color: 'bg-red-100 text-red-700',
  },
} as const;

/**
 * Default page size untuk pagination
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maksimal ukuran file upload (dalam bytes)
 * 10MB = 10 * 1024 * 1024
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Format tanggal yang didukung
 */
export const DATE_FORMATS = {
  display: 'dd MMMM yyyy',
  displayWithTime: 'dd MMMM yyyy HH:mm',
  input: 'yyyy-MM-dd',
  inputWithTime: "yyyy-MM-dd'T'HH:mm",
  database: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

/**
 * Endpoint API
 */
export const API_ENDPOINTS = {
  users: '/api/users',
  activities: '/api/activities',
  notifications: '/api/notifications',
} as const;

/**
 * Pesan error umum
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
  UNAUTHORIZED: 'Anda tidak memiliki akses ke resource ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi.',
  UNKNOWN_ERROR: 'Terjadi kesalahan yang tidak diketahui.',
} as const;

/**
 * Pesan sukses umum
 */
export const SUCCESS_MESSAGES = {
  CREATE: 'Data berhasil ditambahkan.',
  UPDATE: 'Data berhasil diperbarui.',
  DELETE: 'Data berhasil dihapus.',
  UPLOAD: 'File berhasil diunggah.',
} as const;

/**
 * Regex patterns untuk validasi
 */
export const VALIDATION_PATTERNS = {
  WHATSAPP: /^\+62\d{8,13}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+62|0)\d{8,13}$/,
} as const;

/**
 * Zona waktu default (WITA - Waktu Indonesia Tengah)
 * Offset: UTC+8
 */
export const DEFAULT_TIMEZONE = 'Asia/Makassar';

/**
 * Hari kerja untuk kalender
 */
export const WORKING_DAYS = [1, 2, 3, 4, 5]; // Senin - Jumat

/**
 * Jam kerja default
 */
export const WORKING_HOURS = {
  start: 8, // 08:00
  end: 17, // 17:00
} as const;

/**
 * Konfigurasi untuk reminder H-1
 * Notifikasi dikirim jam berapa (format 24 jam)
 */
export const REMINDER_SEND_HOUR = 9; // 09:00 WITA

/**
 * Interval untuk cron job auto-update status (dalam menit)
 */
export const AUTO_UPDATE_INTERVAL = 60; // 1 jam

/**
 * Links penting untuk navigasi
 */
export const NAV_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/admin/kalender', label: 'Kalender', icon: 'Calendar' },
  { href: '/admin/kegiatan', label: 'Kegiatan', icon: 'ListTodo' },
  { href: '/admin/pengguna', label: 'Pengguna', icon: 'Users' },
  { href: '/admin/laporan', label: 'Laporan', icon: 'FileText' },
  { href: '/admin/profil', label: 'Profil', icon: 'User' },
] as const;

/**
 * Metadata aplikasi
 */
export const APP_METADATA = {
  name: 'SIMAK',
  fullName: 'Sistem Informasi dan Manajemen Administrasi Kegiatan',
  organization: 'BPS Kabupaten Flores Timur',
  version: '1.0.0',
  developer: 'Rio Manuppak Siahaan',
  description: 'Platform koordinasi kegiatan lintas tim untuk mengurangi tumpang tindih agenda dan keterlambatan administrasi',
} as const;
