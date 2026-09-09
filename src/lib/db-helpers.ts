// Utility functions untuk operasi database Supabase
import { supabase, User, Activity } from './supabase';

/**
 * Helper untuk handle error response dari Supabase
 */
export function handleSupabaseError(error: any) {
  console.error('Supabase Error:', error);
  return {
    success: false,
    error: error.message || 'Terjadi kesalahan pada database',
  };
}

/**
 * Format tanggal ke format ISO untuk database
 */
export function formatDateForDB(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Format tanggal dari database ke format Indonesia
 */
export function formatDateIndonesia(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(date));
}

/**
 * Hitung selisih hari antara dua tanggal
 */
export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get statistik dashboard
 */
export async function getDashboardStats(actorId?: string) {
  try {
    // Ambil activities (filter actor jika ada)
    let query = supabase
      .from('activities')
      .select('status, deadline');
    
    if (actorId) {
      query = query.eq('actor_id', actorId);
    }

    const { data: activities, error } = await query;

    if (error) return handleSupabaseError(error);

    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    const stats = {
      active: activities?.filter(a => a.status === 'active').length || 0,
      dueSoon: activities?.filter(a => {
        const deadline = new Date(a.deadline);
        return deadline > now && deadline <= twoDaysFromNow && a.status !== 'completed';
      }).length || 0,
    };

    // Get failed notifications count (filter user jika ada)
    let notifQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');
      
    if (actorId) {
      notifQuery = notifQuery.eq('user_id', actorId);
    }

    const { count: failedNotifications } = await notifQuery;

    return {
      success: true,
      data: {
        ...stats,
        failedNotifications: failedNotifications || 0,
      },
    };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

/**
 * Get kegiatan yang perlu perhatian (jatuh tempo <=2 hari)
 */
export async function getAttentionRequired(actorId?: string) {
  try {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);

    let query = supabase
      .from('activities')
      .select('*');

    if (actorId) {
      query = query.eq('actor_id', actorId);
    }

    query = query
      .lte('deadline', twoDaysFromNow.toISOString())
      .neq('status', 'completed')
      .order('deadline', { ascending: true })
      .limit(10);

    const { data, error } = await query;

    if (error) return handleSupabaseError(error);

    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

/**
 * Get aktivitas terbaru (log untuk dashboard)
 */
export async function getRecentActivities(limit: number = 10) {
  try {
    // Ambil activities yang baru dibuat atau diupdate
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, actor_name, updated_at, status')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (activitiesError) return handleSupabaseError(activitiesError);

    // Ambil notifications yang baru dikirim
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('type, sent_at, status')
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (notificationsError) return handleSupabaseError(notificationsError);

    return {
      success: true,
      data: {
        activities,
        notifications,
      },
    };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

/**
 * Get compliance rate per tim (persentase kepatuhan deadline)
 */
export async function getTeamCompliance() {
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('team, status, deadline, updated_at');

    if (error) return handleSupabaseError(error);

    // Hitung compliance per tim
    const teamStats: { [key: string]: { total: number; onTime: number } } = {};

    activities?.forEach(activity => {
      if (!teamStats[activity.team]) {
        teamStats[activity.team] = { total: 0, onTime: 0 };
      }

      teamStats[activity.team].total++;

      // Dianggap on-time jika completed sebelum deadline atau masih active dan belum overdue
      if (activity.status === 'completed') {
        const completedDate = new Date(activity.updated_at);
        const deadline = new Date(activity.deadline);
        if (completedDate <= deadline) {
          teamStats[activity.team].onTime++;
        }
      } else if (activity.status === 'active') {
        teamStats[activity.team].onTime++;
      }
    });

    // Convert ke format compliance percentage
    const compliance = Object.entries(teamStats).map(([team, stats]) => ({
      name: team,
      percentage: Math.round((stats.onTime / stats.total) * 100),
      total: stats.total,
      onTime: stats.onTime,
    })).sort((a, b) => b.percentage - a.percentage);

    return { success: true, data: compliance };
  } catch (error) {
    return handleSupabaseError(error);
  }
}

/**
 * Validasi nomor WhatsApp format Indonesia
 */
export function validateWhatsAppNumber(number: string): boolean {
  // Format: +62 diikuti 8-13 digit
  const regex = /^\+62\d{8,13}$/;
  return regex.test(number);
}

/**
 * Mapping status Indonesia ke status database
 */
export function mapStatusToDatabase(statusIndo: string): string {
  const statusMap: { [key: string]: string } = {
    'Belum Dimulai': 'pending',
    'Sedang Berjalan': 'active',
    'Selesai': 'completed',
  };
  return statusMap[statusIndo] || statusIndo.toLowerCase();
}

/**
 * Mapping status database ke Bahasa Indonesia
 */
export function mapStatusToIndonesian(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Belum Dimulai',
    'active': 'Sedang Berjalan',
    'completed': 'Selesai',
  };
  return statusMap[status] || status;
}

/**
 * Nama tampilan tim untuk UI.
 * Kolom `team` di DB kadang menyimpan jabatan struktural ("Ketua Tim Produksi")
 * bukan nama tim ringkas ("Produksi"). Saat menampilkan di UI, samakan awalan
 * "Ketua Tim " menjadi "Tim " (mis. "Ketua Tim Produksi" -> "Tim Produksi").
 * Nilai asli di database TIDAK diubah — ini murni untuk tampilan.
 */
export function displayTeamName(team: string): string {
  if (!team) return team;
  return team.replace(/^Ketua Tim\s+/, "Tim ");
}

/**
 * Get warna tim berdasarkan nama tim
 */
export function getTeamColor(teamName: string): string {
  const teamColors: { [key: string]: string } = {
    'Ketua Tim Sosial': '#3B82F6', // blue
    'Ketua Tim Produksi': '#F97316', // orange
    'Ketua Tim Distribusi': '#10B981', // green
    'Ketua Tim IPDS': '#8B5CF6', // purple
    'Ketua Tim Nerwilis': '#EF4444', // red
    'Ketua Tim PSS': '#06B6D4', // cyan
    'Kepala Sub Bagian Umum': '#F59E0B', // amber
    'Ketua Tim Sakernas': '#EC4899', // pink
  };
  return teamColors[teamName] || '#6B7280'; // gray default
}
