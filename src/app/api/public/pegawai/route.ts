import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET - Daftar pegawai untuk landing page (foto profil + nama + tim)
// Route ini PUBLIC — hanya mengembalikan field aman (name, nip, team), tanpa whatsapp/role
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('name, nip, team')
      .not('nip', 'is', null)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data pegawai', details: error.message },
        { status: 500 }
      );
    }

    const pegawai = (data ?? []).map((u) => ({
      name: u.name,
      nip: u.nip,
      team: u.team,
      // URL foto publik di Supabase Storage — dibangun dari NIP
      photo: u.nip
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/foto-pegawai/${u.nip}.webp`
        : null,
    }));

    return NextResponse.json({ data: pegawai }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
