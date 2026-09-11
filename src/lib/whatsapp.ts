// src/lib/whatsapp.ts
// Layanan kirim WhatsApp via Fonnte untuk SIMAK
// Dipakai oleh: trigger aktivitas dibuat, cron H-1, cron overdue, bukti dukung

import { supabase } from '@/lib/supabase';
import type { User, Notification } from '@/lib/supabase';
import {
  buildNotificationMessage as buildMessageFromTemplate,
  formatDateIndonesia,
  NOTIFICATION_TEMPLATES,
  renderTemplate,
  type NotificationType,
} from './notification-templates';

const FONNTE_API_URL = process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send';
const FONNTE_API_KEY = process.env.WHATSAPP_API_KEY;

if (!FONNTE_API_KEY) {
  // Warning only — biarkan aplikasi jalan, notifikasi WhatsApp nonaktif
  console.warn('[WhatsApp] WHATSAPP_API_KEY belum diset — notifikasi WhatsApp nonaktif');
}

/**
 * Kirim pesan WhatsApp ke satu nomor via Fonnte
 * @param target Nomor tujuan (format: +628xxxx atau 628xxxx atau 08xxxx)
 * @param message Isi pesan (support *bold*, _italic_, ~strikethrough~)
 * @param meta Metadata untuk logging (opsional)
 * @returns { success: boolean, messageId?: string, error?: string, logData?: object }
 */
export async function sendWhatsApp(
  target: string,
  message: string,
  meta?: {
    test?: boolean;
    activityId?: string;
    userId?: string;
    type?: string;
    actorName?: string;
    activityTitle?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string; logData?: object }> {
  const startTime = Date.now();

  if (!FONNTE_API_KEY) {
    const logData = {
      ...meta,
      status: 'failed',
      error: 'API key tidak dikonfigurasi',
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
    return { success: false, error: 'API key tidak dikonfigurasi', logData };
  }

  // Fonnte butuh format: 628xxxx (tanpa +, tanpa 0 depan)
  const cleanTarget = target
    .replace(/^\+?62/, '62')  // +628... atau 628... → 628...
    .replace(/^0/, '62');      // 08... → 628...

  // Validasi sederhana: pastikan angka & panjang wajar
  if (!/^62\d{8,13}$/.test(cleanTarget)) {
    const logData = {
      ...meta,
      status: 'failed',
      error: `Format nomor tidak valid: ${target}`,
      duration_ms: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
    return { success: false, error: `Format nomor tidak valid: ${target}`, logData };
  }

  try {
    console.log(`[WhatsApp] Mengirim ke ${cleanTarget} (${meta?.actorName || 'user'})...`);

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': FONNTE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: cleanTarget,
        message,
        countryCode: '62', // Default Indonesia
      }),
    });

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Fonnte response sukses: { status: true, data: { message_id: "..." } }
    if (response.ok && result.status === true) {
      const logData = {
        ...meta,
        status: 'sent',
        message_id: result.data?.message_id,
        phone: cleanTarget,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      };
      console.log(`[WhatsApp] ✅ Berhasil (${duration}ms):`, result.data?.message_id);
      return { success: true, messageId: result.data?.message_id, logData };
    }

    // Error response: { status: false, reason: "..." }
    const errorMsg = result.reason || result.message || `HTTP ${response.status}: ${JSON.stringify(result)}`;
    const logData = {
      ...meta,
      status: 'failed',
      error: errorMsg,
      phone: cleanTarget,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };
    console.error(`[WhatsApp] ❌ Gagal (${duration}ms):`, errorMsg);
    return { success: false, error: errorMsg, logData };
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMsg = String(err);
    const logData = {
      ...meta,
      status: 'error',
      error: errorMsg,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    };
    console.error(`[WhatsApp] ❌ Exception (${duration}ms):`, errorMsg);
    return { success: false, error: errorMsg, logData };
  }
}

/**
 * Kirim notifikasi ke satu aktor & catat ke tabel notifications
 * @returns { success: boolean, notificationId?: string, error?: string, logData?: object }
 */
export async function notifyActor(params: {
  activity_id: string;
  user_id: string;
  type: NotificationType;
  user: Pick<User, 'id' | 'name' | 'whatsapp'>;
  activity: {
    id?: string;
    title: string;
    team: string;
    start_date: string;
    deadline: string;
    description?: string;
    evidence_url?: string;
  };
}): Promise<{ success: boolean; notificationId?: string; error?: string; logData?: object }> {
  const { activity_id, user_id, type, user, activity } = params;

  // 1. Bangun pesan menggunakan template dari notification-templates.ts
  // Teruskan activity.id dan user_id untuk generate link form bukti dukung
  const message = buildMessageFromTemplate(
    type,
    { ...activity, id: activity_id },
    user.name,
    user_id
  );

  // 2. Kirim via Fonnte dengan metadata untuk logging
  const sendResult = await sendWhatsApp(user.whatsapp, message, {
    activityId: activity_id,
    userId: user_id,
    type,
    actorName: user.name,
    activityTitle: activity.title,
  });

  // 3. Simpan log ke database (idempotent: upsert by activity_id + user_id + type)
  // Syarat: tabel notifications WAJIB punya unique constraint (activity_id,
  // user_id, type) — lihat supabase-migration-notifications-unique.sql.
  // Tanpa ini, ON CONFLICT error tiap kali dan log tidak pernah tercatat
  // padahal WhatsApp sudah terkirim.
  const { data: notif, error: dbError } = await supabase
    .from('notifications')
    .upsert(
      {
        activity_id,
        user_id,
        type,
        status: sendResult.success ? 'sent' : 'failed',
        sent_at: sendResult.success ? new Date().toISOString() : null,
        error_message: sendResult.error || null,
        // Simpan detail respons Fonnte (message_id, phone, duration) sebagai
        // JSON di kolom log_data untuk keperluan debugging/dashboard.
        log_data: sendResult.logData || null,
      },
      {
        onConflict: 'activity_id,user_id,type',
      }
    )
    .select()
    .single();

  if (dbError) {
    console.error('[WhatsApp] Gagal simpan log notifikasi:', dbError);
    return { success: false, error: dbError.message, logData: sendResult.logData };
  }

  console.log(`[WhatsApp] Notifikasi ${type} ke ${user.name}: ${sendResult.success ? '✅ SENT' : '❌ FAILED'}`);

  return {
    success: sendResult.success,
    notificationId: notif?.id,
    error: sendResult.error,
    logData: sendResult.logData,
  };
}

/**
 * Kirim notifikasi ke SEMUA pelaksana suatu kegiatan (PIC + petugas).
 * Sumber data sesuai model terbaru (migration 2 Sept 2026):
 *  - PIC     → kolom activities.actor_id (+ users untuk whatsapp)
 *  - Petugas → junction table activity_officers (join ke users utk whatsapp)
 * TIDAK pakai junction legacy activity_actors yang tidak pernah diisi kode apa pun.
 * @returns { success: number, failed: number, details: Array<{user_id, success, error?, logData?}> }
 */
export async function notifyAllActors(
  activityId: string,
  type: NotificationType
): Promise<{ success: number; failed: number; details: any[] }> {
  // Ambil data kegiatan lengkap (termasuk actor_id/actor_name untuk PIC)
  const { data: activity, error: actErr } = await supabase
    .from('activities')
    .select('id, title, team, start_date, deadline, description, evidence_url, actor_id, actor_name')
    .eq('id', activityId)
    .single();

  if (actErr || !activity) {
    return { success: 0, failed: 0, details: [{ error: 'Kegiatan tidak ditemukan' }] };
  }

  // Supabase join `users!inner(whatsapp)` mengembalikan array — cast ke objek tunggal
  type ActorRow = { user_id: string; user_name: string; users: { whatsapp: string } | { whatsapp: string }[] };
  const all: { user_id: string; user_name: string; whatsapp: string }[] = [];
  const seen = new Set<string>();

  // 1. PIC: whatsapp diambil dari tabel users (kolom activities tidak menyimpannya)
  if (activity.actor_id && !seen.has(activity.actor_id)) {
    seen.add(activity.actor_id);
    const { data: picUser } = await supabase
      .from('users')
      .select('whatsapp')
      .eq('id', activity.actor_id)
      .single();
    if (picUser?.whatsapp) {
      all.push({
        user_id: activity.actor_id,
        user_name: activity.actor_name || '',
        whatsapp: picUser.whatsapp,
      });
    }
  }

  // 2. Petugas pelaksana via junction activity_officers
  const { data: officers, error: officerErr } = await supabase
    .from('activity_officers')
    .select('user_id, user_name, users!inner(whatsapp)')
    .eq('activity_id', activityId);

  if (officerErr) {
    return { success: 0, failed: 0, details: [{ error: officerErr.message }] };
  }

  for (const o of (officers || []) as unknown as ActorRow[]) {
    if (seen.has(o.user_id)) continue; // jangan kirim ganda jika juga PIC
    seen.add(o.user_id);
    const whatsapp = Array.isArray(o.users) ? o.users[0]?.whatsapp : o.users.whatsapp;
    if (whatsapp) {
      all.push({ user_id: o.user_id, user_name: o.user_name, whatsapp });
    }
  }

  if (all.length === 0) {
    return {
      success: 0,
      failed: 0,
      details: [{ error: 'Tidak ada pelaksana (PIC/petugas) dengan nomor WhatsApp terdaftar' }],
    };
  }

  // Kirim ke setiap pelaksana paralel (batch) — rate limit Fonnte ~30/menit, cukup utk skala BPS
  const results = await Promise.all(
    all.map(async (a) => {
      const res = await notifyActor({
        activity_id: activityId,
        user_id: a.user_id,
        type,
        user: { id: a.user_id, name: a.user_name, whatsapp: a.whatsapp },
        activity,
      });
      return { user_id: a.user_id, ...res };
    })
  );

  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`[WhatsApp] notifyAllActors ${type} untuk activity ${activityId}: ${success} success, ${failed} failed`);

  return { success, failed, details: results };
}

// Re-export untuk backward compatibility
export { buildMessageFromTemplate as buildNotificationMessage };
export type { NotificationType };
