import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Ambil semua notifikasi atau filter berdasarkan activity/user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activityId = searchParams.get('activity_id');
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (activityId) {
      query = query.eq('activity_id', activityId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data notifikasi', details: error.message },
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

// POST - Buat notifikasi baru (untuk trigger manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activity_id, user_id, type } = body;

    if (!activity_id || !user_id || !type) {
      return NextResponse.json(
        { error: 'Field wajib: activity_id, user_id, type' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          activity_id,
          user_id,
          type,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Gagal membuat notifikasi', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, message: 'Notifikasi berhasil dibuat' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
