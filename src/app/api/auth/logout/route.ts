// src/app/api/auth/logout/route.ts
// API Logout SIMAK

import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

const SESSION_COOKIE_NAME = 'simak_session';

export async function POST(request: NextRequest) {
  try {
    // Ambil token dari header atau cookie
    const authHeader = request.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/simak_session=([^;]+)/);
        if (match) token = match[1];
      }
    }

    if (token) {
      await logout(token);
    }

    // Buat response DULU, lalu hapus cookie pada response tersebut
    const response = NextResponse.json({
      success: true,
      message: 'Berhasil logout',
    });

    // Delete cookie pada response
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (err) {
    console.error('[API Auth Logout] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}