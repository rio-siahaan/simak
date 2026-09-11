import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET - Ambil daftar aktor/pelaksana suatu kegiatan
 * Query params:
 * - actor_id: (opsional) filter berdasarkan user_id untuk verifikasi
 *
 * Sumber data aktor ada DUA — JANGAN pakai tabel legacy `activity_actors`
 * (tidak pernah dibuat/diisi oleh migration & kode apa pun):
 *  1) PIC/Penanggung Jawab  → kolom `activities.actor_id` (+ actor_name)
 *  2) Petugas pelaksana      → junction table `activity_officers`
 * Kegiatan yang dibuat lewat POST /api/activities menyimpan PIC di tabel
 * activities dan petugas di activity_officers, jadi verifikasi wajib
 * mengecek keduanya — ini penyebab link bukti dukung menampilkan
 * "Data Tidak Ditemukan" bagi PIC yang sah.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const actorId = searchParams.get('actor_id');

    // 1. PIC (aktor utama) ada di tabel activities, bukan di junction
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .select('actor_id, actor_name')
      .eq('id', id)
      .single();

    if (actError) {
      // Kegiatan tidak ada → kosong; halaman bukti akan menampilkan
      // "data tidak ditemukan" (perilaku sama dengan sebelumnya).
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const data: { user_id: string; user_name: string }[] = [];
    if (activity.actor_id) {
      data.push({
        user_id: activity.actor_id,
        user_name: activity.actor_name || '',
      });
    }

    // 2. Petugas pelaksana ada di junction activity_officers
    const { data: officers, error: offError } = await supabase
      .from('activity_officers')
      .select('user_id, user_name')
      .eq('activity_id', id);

    if (offError) {
      return NextResponse.json(
        { error: 'Gagal mengambil data petugas', details: offError.message },
        { status: 500 }
      );
    }

    if (officers) {
      data.push(...officers);
    }

    // 3. Filter berdasarkan actor_id jika ada (untuk verifikasi akses)
    const result = actorId ? data.filter((a) => a.user_id === actorId) : data;

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
