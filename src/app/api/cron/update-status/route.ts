import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * CRON JOB: Auto-update status kegiatan 'pending' -> 'active'
 * Dipanggil secara berkala (misal setiap jam) via cron job.
 *
 * Status "Terlambat/overdue" sudah dihapus dari sistem, dan notifikasi
 * hanya dikirim pada 2 momen (kegiatan ditugaskan & kegiatan selesai),
 * jadi cron cukup menandai kegiatan yang tanggal mulainya sudah tiba
 * sebagai "Sedang Berjalan". Kegiatan yang lewat deadline tetap 'active'
 * sampai status diubah jadi 'completed' oleh admin/PIC.
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

    // Update pending -> active (tanggal mulai sudah tiba)
    const { data: toActive, error: activeError } = await supabase
      .from('activities')
      .update({ status: 'active', updated_at: now })
      .eq('status', 'pending')
      .lte('start_date', now)
      .select('id, title');

    if (activeError) {
      console.error('[Cron] Error updating to active:', activeError);
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-update status selesai',
      updated_to_active: toActive?.length || 0,
      details: {
        active: toActive?.map((a) => ({ id: a.id, title: a.title })) || [],
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