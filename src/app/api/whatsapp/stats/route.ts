import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/whatsapp/stats
 * Statistik penggunaan WhatsApp untuk dashboard
 * Query params:
 * - start_date: Filter dari tanggal (ISO string)
 * - end_date: Filter sampai tanggal (ISO string)
 * - type: Filter tipe notifikasi (created, reminder_h1, overdue, evidence_uploaded)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Base query untuk notifications
    let query = supabase
      .from('notifications')
      .select(`
        id,
        activity_id,
        user_id,
        type,
        status,
        sent_at,
        error_message,
        created_at,
        activities!inner (
          id,
          title,
          team,
          start_date,
          deadline
        ),
        users!inner (
          id,
          name,
          team,
          whatsapp
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter tanggal
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Filter tipe
    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil statistik', details: error.message },
        { status: 500 }
      );
    }

    // Hitung statistik
    const total = notifications?.length || 0;
    const sent = notifications?.filter(n => n.status === 'sent').length || 0;
    const failed = notifications?.filter(n => n.status === 'failed').length || 0;
    const pending = notifications?.filter(n => n.status === 'pending').length || 0;

    // Statistik per tipe
    const byType = notifications?.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Supabase join mengembalikan array untuk relasi — cast via unknown ke bentuk yang benar
    const typedNotifications = (notifications || []) as unknown as Array<{
      id: any; activity_id: any; user_id: any; type: any; status: any;
      sent_at: any; error_message: any; created_at: any;
      activities: { id: any; title: any; team: any; start_date: any; deadline: any } | null;
      users: { id: any; name: any; team: any; whatsapp: any } | null;
    }>;

    // Statistik per user
    const byUser = typedNotifications.reduce((acc, n) => {
      const userName = n.users?.name || 'Unknown';
      acc[userName] = (acc[userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Statistik per tim
    const byTeam = typedNotifications.reduce((acc, n) => {
      const team = n.users?.team || 'Unknown';
      acc[team] = (acc[team] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Error details untuk yang gagal
    const failedDetails = typedNotifications.filter(n => n.status === 'failed').map(n => ({
      activity: n.activities?.title,
      user: n.users?.name,
      type: n.type,
      error: n.error_message,
      sent_at: n.sent_at,
    })) || [];

    return NextResponse.json({
      summary: {
        total,
        sent,
        failed,
        pending,
        success_rate: total > 0 ? ((sent / total) * 100).toFixed(1) : '0',
      },
      by_type: byType,
      by_user: byUser,
      by_team: byTeam,
      failed_details: failedDetails,
      recent: notifications?.slice(0, 20) || [],
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}