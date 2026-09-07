import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Ambil daftar aktor untuk suatu kegiatan
 * Query params:
 * - actor_id: (opsional) filter berdasarkan actor_id untuk verifikasi
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const actorId = searchParams.get('actor_id');

    let query = supabase
      .from('activity_actors')
      .select('user_id, user_name')
      .eq('activity_id', id);

    // Filter berdasarkan actor_id jika ada (untuk verifikasi akses)
    if (actorId) {
      query = query.eq('user_id', actorId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data aktor', details: error.message },
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
