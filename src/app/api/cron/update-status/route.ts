import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * CRON JOB: Auto-update status kegiatan berdasarkan tanggal
 * Dipanggil secara berkala (misal setiap jam) via cron job
 *
 * Logika:
 * - pending  : start_date > sekarang (belum dimulai)
 * - active   : start_date <= sekarang <= deadline (sedang berjalan)
 * - overdue  : deadline < sekarang & status != completed (terlambat)
 * - completed: Manual set oleh admin/PIC
 * - delayed  : Manual set oleh admin/PIC (tertunda)
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && cronSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    // 1. Update pending -> active (sudah lewat start_date, belum deadline)
    const { data: toActive, error: activeError } = await supabase
      .from('activities')
      .update({ status: 'active', updated_at: now })
      .eq('status', 'pending')
      .lte('start_date', now)
      .gte('deadline', now)
      .select('id, title');

    if (activeError) {
      console.error('[Cron] Error updating to active:', activeError);
    }

    // 2. Update pending/active -> overdue (sudah lewat deadline)
    const { data: toOverdue, error: overdueError } = await supabase
      .from('activities')
      .update({ status: 'overdue', updated_at: now })
      .in('status', ['pending', 'active'])
      .lt('deadline', now)
      .select('id, title');

    if (overdueError) {
      console.error('[Cron] Error updating to overdue:', overdueError);
    }

    // 3. Kirim notifikasi overdue ke PIC
    if (toOverdue && toOverdue.length > 0) {
      try {
        const { notifyAllActors } = await import('@/lib/whatsapp');

        for (const activity of toOverdue) {
          notifyAllActors(activity.id, 'overdue').then((result) => {
            console.log('[Cron] Notifikasi overdue:', result);
          }).catch((err) => {
            console.error('[Cron] Gagal kirim notifikasi overdue:', err);
          });
        }
      } catch (err) {
        console.error('[Cron] Error notifikasi overdue:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-update status selesai',
      updated_to_active: toActive?.length || 0,
      updated_to_overdue: toOverdue?.length || 0,
      details: {
        active: toActive?.map((a) => ({ id: a.id, title: a.title })) || [],
        overdue: toOverdue?.map((a) => ({ id: a.id, title: a.title })) || [],
      },
    });
  } catch (error) {
    console.error('[Cron] Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET untuk testing manual
export async function GET(request: NextRequest) {
  return POST(request);
}