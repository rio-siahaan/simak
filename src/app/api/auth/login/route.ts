// src/app/api/auth/login/route.ts
// API Login SIMAK: NIP + Role
// POST { nip, role } -> { success, user, token }

import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'simak_session';
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nip, role } = body;

    // Validasi input
    if (!nip || !role) {
      return NextResponse.json(
        { success: false, error: 'NIP dan role wajib diisi' },
        { status: 400 }
      );
    }

    if (!['Admin', 'Aktor'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role tidak valid. Gunakan: Admin atau Aktor' },
        { status: 400 }
      );
    }

    // Proses login
    const result = await login(nip, role);

    if (!result.success || !result.user || !result.token) {
      return NextResponse.json(
        { success: false, error: result.error || 'Login gagal' },
        { status: 401 }
      );
    }

    // Buat response DULU, lalu set cookie pada response tersebut
    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        team: result.user.team,
        role: result.user.role,
        nip: result.user.nip,
      },
      message: `Selamat datang, ${result.user.name}!`,
    });

    // Set cookie pada response (bukan via cookies() helper yang buat implicit response)
    response.cookies.set(SESSION_COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[API Auth Login] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}