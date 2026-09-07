import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Hitung status otomatis berdasarkan tanggal mulai dan deadline.
 * pending  : belum dimulai (start_date > sekarang)
 * active   : sedang berjalan (start_date ≤ sekarang ≤ deadline)
 * overdue  : terlambat (deadline < sekarang)
 */
function computeAutoStatus(
  start_date: string,
  deadline: string
): 'pending' | 'active' | 'overdue' {
  const now = new Date();
  const start = new Date(start_date);
  const end = new Date(deadline);
  if (now < start) return 'pending';
  if (now > end) return 'overdue';
  return 'active';
}

// GET - Ambil semua activities atau filter
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const team = searchParams.get('team');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const actorId = searchParams.get('actor_id');

    // Jika filter aktor: ambil activity_id dari junction table dulu
    let allowedIds: string[] | null = null;
    if (actorId) {
      const { data: junctionRows, error: jErr } = await supabase
        .from('activity_officers')
        .select('activity_id')
        .eq('user_id', actorId);

      if (jErr) {
        return NextResponse.json(
          { error: 'Gagal filter aktor', details: jErr.message },
          { status: 500 }
        );
      }

      allowedIds = (junctionRows || []).map((r: any) => r.activity_id);
      // Jika tidak ada kegiatan untuk aktor ini, langsung return kosong
      if (allowedIds.length === 0) {
        return NextResponse.json({ data: [] }, { status: 200 });
      }
    }

    let query = supabase
      .from('activities')
      .select('*')
      .order('start_date', { ascending: false });

    // Filter berdasarkan ID yang diizinkan (hasil junction lookup)
    if (allowedIds !== null) {
      query = query.in('id', allowedIds);
    }

    // Filter berdasarkan tim
    if (team && team !== 'Semua Tim') {
      query = query.eq('team', team);
    }

    // Filter berdasarkan status
    if (status && status !== 'Semua Status') {
      const statusMap: { [key: string]: string } = {
        'Belum Dimulai': 'pending',
        'Sedang Berjalan': 'active',
        'Selesai': 'completed',
        'Terlambat': 'overdue',
        'Tertunda': 'delayed',
      };
      const mappedStatus = statusMap[status] || status.toLowerCase();
      query = query.eq('status', mappedStatus);
    }

    // Search berdasarkan judul
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Filter berdasarkan range tanggal (untuk kalender)
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('start_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data kegiatan', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Tambah kegiatan baru (hanya Admin/Ketua Tim)
export async function POST(request: NextRequest) {
  try {
    // Ambil user info dari middleware headers
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role');
    const userNip = request.headers.get('x-user-nip');

    // Logging untuk audit trail
    console.log(`[API Activities POST] User: ${userName} (${userRole}, NIP: ${userNip})`);

    const body = await request.json();
    const {
      title,
      team,
      team_color,
      actor_id,            // PIC tunggal (wajib)
      actor_name,          // Nama PIC
      officer_ids = [],    // Array UUID petugas pelaksana
      officer_names = [],  // Array nama petugas
      officer_teams = [],  // Array tim petugas
      start_date,
      deadline,
      description,
      progress = 0,
    } = body;

    // Validasi input wajib
    if (!title || !team || !actor_id || !start_date || !deadline) {
      return NextResponse.json(
        { error: 'Field wajib: title, team, actor_id, start_date, deadline' },
        { status: 400 }
      );
    }

    // Validasi tanggal
    if (new Date(deadline) < new Date(start_date)) {
      return NextResponse.json(
        { error: 'Deadline tidak boleh lebih awal dari tanggal mulai' },
        { status: 400 }
      );
    }

    // Hitung status otomatis dari tanggal
    const autoStatus = computeAutoStatus(start_date, deadline);

    // Insert activity utama
    const { data: activity, error: insertError } = await supabase
      .from('activities')
      .insert([
        {
          title,
          team,
          team_color,
          actor_id,
          actor_name,
          start_date,
          deadline,
          status: autoStatus,
          progress,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Gagal menambah kegiatan', details: insertError.message },
        { status: 500 }
      );
    }

    // Insert relasi petugas ke junction table activity_officers
    if (officer_ids.length > 0) {
      const officerRows = officer_ids.map((userId: string, idx: number) => ({
        activity_id: activity.id,
        user_id: userId,
        user_name: officer_names[idx] || '',
        user_team: officer_teams[idx] || '',
      }));

      const { error: officerInsertError } = await supabase
        .from('activity_officers')
        .insert(officerRows);

      if (officerInsertError) {
        console.warn('Gagal insert activity_officers:', officerInsertError.message);
      }
    }

    // 🔔 TRIGGER NOTIFIKASI WHATSAPP KE PIC
    let notificationResult = { success: false, error: 'Not processed' };

    try {
      const { notifyActor } = await import('@/lib/whatsapp');

      // Ambil data user PIC lengkap dengan whatsapp
      const { data: actorUser, error: userError } = await supabase
        .from('users')
        .select('id, name, whatsapp')
        .eq('id', actor_id)
        .single();

      if (userError) {
        console.error('[WhatsApp] Error mengambil data PIC:', userError);
        notificationResult = { success: false, error: 'PIC tidak ditemukan di database' };
      } else if (!actorUser) {
        console.error('[WhatsApp] PIC tidak ditemukan untuk ID:', actor_id);
        notificationResult = { success: false, error: 'PIC tidak ditemukan' };
      } else if (!actorUser.whatsapp) {
        console.error('[WhatsApp] PIC tidak punya nomor WhatsApp:', actorUser.name);
        notificationResult = { success: false, error: 'PIC tidak punya nomor WhatsApp' };
      } else {
        // Kirim notifikasi dan tunggu hasilnya
        console.log('[WhatsApp] Mengirim notifikasi ke PIC:', actorUser.name, actorUser.whatsapp);

        notificationResult = await notifyActor({
          activity_id: activity.id,
          user_id: actorUser.id,
          type: 'created',
          user: actorUser,
          activity: {
            id: activity.id,
            title,
            team,
            start_date,
            deadline,
            description,
          },
        });

        if (notificationResult.success) {
          console.log('[WhatsApp] ✅ Notifikasi berhasil terkirim ke', actorUser.name);
        } else {
          console.error('[WhatsApp] ❌ Gagal kirim notifikasi:', notificationResult.error);
        }
      }
    } catch (err) {
      console.error('[WhatsApp] Error tidak terduga:', err);
      notificationResult = { success: false, error: String(err) };
    }

    return NextResponse.json(
      {
        data: activity,
        message: 'Kegiatan berhasil ditambahkan',
        auto_status: autoStatus,
        notification: {
          sent: notificationResult.success,
          error: notificationResult.success ? null : notificationResult.error,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

