// src/lib/notification-templates.ts
// Template pesan notifikasi WhatsApp untuk SIMAK
// File ini bisa diedit untuk mengubah isi pesan notifikasi

import type { Activity } from './supabase';

/**
 * Tipe notifikasi yang didukung
 */
export type NotificationType = 'created' | 'completed';

/**
 * Parameter yang tersedia untuk template
 */
export interface TemplateParams {
  actorName: string;
  title: string;
  team: string;
  startDate: string;
  deadline: string;
  description?: string;
  evidenceUrl?: string;
  activityId?: string;
  actorId?: string;
  evidenceFormUrl?: string;
  startDateFormatted: string;
  deadlineFormatted: string;
  createdAtFormatted: string;
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDateIndonesia(
  dateStr: string,
  includeTime: boolean = false
): string {
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('id-ID', options);
  } catch {
    return dateStr;
  }
}

/**
 * ============================================
 * TEMPLATE NOTIFIKASI - SILAKAN EDIT DI BAWAH
 * ============================================
 *
 * Variabel yang tersedia di dalam template:
 * - {actorName} : Nama aktor/pelaksana
 * - {title} : Judul kegiatan
 * - {team} : Nama tim
 * - {startDateFormatted} : Tanggal mulai (format Indonesia)
 * - {deadlineFormatted} : Tanggal deadline (format Indonesia)
 * - {description} : Deskripsi kegiatan (jika ada)
 * - {evidenceUrl} : Link bukti dukung (jika ada)
 * - {createdAtFormatted} : Tanggal kegiatan dibuat
 */

export const NOTIFICATION_TEMPLATES: Record<NotificationType, string> = {
  // ─── KEGIATAN BARU DIBUAT ───
  // Dikirim ke aktor saat admin/PIC menambah kegiatan baru
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

  // ─── KEGIATAN SELESAI ───
  // Dikirim ke aktor saat status kegiatan diubah menjadi Selesai
  completed: `✅ *SIMAK - Kegiatan Selesai*

Halo *{actorName}*,

Kegiatan berikut telah ditandai *SELESAI*:

📋 *{title}*
📍 Tim: {team}
📅 Periode: {startDateFormatted} s/d {deadlineFormatted}

Terima kasih atas pelaksanaan dan dokumentasi kegiatannya.

_SIMAK - BPS Kabupaten Flores Timur_`,
};

/**
 * Template default jika tipe tidak ditemukan
 */
export const DEFAULT_TEMPLATE = `🔔 *SIMAK - Notifikasi Kegiatan*

Halo *{actorName}*,

Ada update terkait kegiatan:
📋 *{title}*
📍 Tim: {team}
📅 Deadline: {deadlineFormatted}

_SIMAK - BPS Kabupaten Flores Timur_`;

/**
 * Fungsi untuk mengganti placeholder dengan nilai aktual
 */
export function renderTemplate(
  template: string,
  params: TemplateParams
): string {
  let result = template;

  // Ganti semua placeholder
  result = result.replace(/{actorName}/g, params.actorName);
  result = result.replace(/{title}/g, params.title);
  result = result.replace(/{team}/g, params.team);
  result = result.replace(/{startDateFormatted}/g, params.startDateFormatted);
  result = result.replace(/{deadlineFormatted}/g, params.deadlineFormatted);
  result = result.replace(/{createdAtFormatted}/g, params.createdAtFormatted);
  result = result.replace(/{description}/g, params.description || '');
  result = result.replace(/{evidenceUrl}/g, params.evidenceUrl || '');
  result = result.replace(/{evidenceFormUrl}/g, params.evidenceFormUrl || '');
  result = result.replace(/{activityId}/g, params.activityId || '');
  result = result.replace(/{actorId}/g, params.actorId || '');

  return result;
}

/**
 * Bangun pesan notifikasi lengkap
 * @param type Jenis notifikasi
 * @param activity Data kegiatan
 * @param actorName Nama aktor
 * @param actorId ID aktor (opsional, untuk link form bukti dukung)
 * @param baseUrl Base URL aplikasi (opsional, default dari env)
 * @returns Pesan WhatsApp yang siap dikirim
 */
export function buildNotificationMessage(
  type: NotificationType,
  activity: {
    id?: string;
    title: string;
    team: string;
    start_date: string;
    deadline: string;
    description?: string;
    evidence_url?: string;
  },
  actorName: string,
  actorId?: string,
  baseUrl?: string
): string {
  const template = NOTIFICATION_TEMPLATES[type] || DEFAULT_TEMPLATE;

  // Generate link form bukti dukung jika ada activityId dan actorId
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const evidenceFormUrl = activity.id && actorId
    ? `${appBaseUrl}/bukti/${activity.id}/${actorId}`
    : '';

  const params: TemplateParams = {
    actorName,
    title: activity.title,
    team: activity.team,
    startDate: activity.start_date,
    deadline: activity.deadline,
    description: activity.description,
    evidenceUrl: activity.evidence_url,
    activityId: activity.id,
    actorId,
    evidenceFormUrl,
    startDateFormatted: formatDateIndonesia(activity.start_date, true),
    deadlineFormatted: formatDateIndonesia(activity.deadline, true),
    createdAtFormatted: formatDateIndonesia(new Date().toISOString(), true),
  };

  return renderTemplate(template, params);
}

/**
 * ============================================
 * CARA MENGUBAH TEMPLATE:
 * ============================================
 *
 * 1. Buka file ini (src/lib/notification-templates.ts)
 * 2. Edit teks di dalam NOTIFICATION_TEMPLATES
 * 3. Gunakan placeholder {namaPlaceholder} untuk variabel dinamis
 * 4. Simpan file
 * 5. Restart aplikasi (npm run dev)
 *
 * Placeholder yang tersedia:
 * - {actorName} : Nama pelaksana
 * - {title} : Judul kegiatan
 * - {team} : Nama tim
 * - {startDateFormatted} : Tanggal mulai
 * - {deadlineFormatted} : Tanggal deadline
 * - {description} : Deskripsi kegiatan
 * - {evidenceUrl} : Link bukti dukung
 *
 * Contoh custom:
 * created: `Halo {actorName}, Anda punya tugas baru: {title}. Selesaikan sebelum {deadlineFormatted}.`
 */
