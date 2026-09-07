import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Ambil semua users atau filter berdasarkan team
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const team = searchParams.get('team');
    const search = searchParams.get('search');

    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter berdasarkan tim jika ada
    if (team && team !== 'Semua Tim') {
      query = query.eq('team', team);
    }

    // Search berdasarkan nama jika ada
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Gagal mengambil data users', details: error.message },
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

// POST - Tambah user baru (hanya Admin)
export async function POST(request: NextRequest) {
  try {
    // Ambil user info dari middleware headers untuk audit trail
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role');
    const userNip = request.headers.get('x-user-nip');

    console.log(`[API Users POST] User: ${userName} (${userRole}, NIP: ${userNip}) creating new user`);

    const body = await request.json();
    const { name, team, whatsapp, role, nip } = body;

    // Validasi input
    if (!name || !team || !whatsapp || !role) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi (name, team, whatsapp, role)' },
        { status: 400 }
      );
    }

    // Validasi format WhatsApp (harus dimulai dengan +62)
    if (!whatsapp.startsWith('+62')) {
      return NextResponse.json(
        { error: 'Nomor WhatsApp harus dimulai dengan +62' },
        { status: 400 }
      );
    }

    // Validasi NIP jika disediakan
    if (nip && nip.length < 10) {
      return NextResponse.json(
        { error: 'NIP minimal 10 digit' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name,
          team,
          whatsapp,
          role,
          nip: nip || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Gagal menambah user', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, message: 'User berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
