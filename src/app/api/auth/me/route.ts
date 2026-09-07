// src/app/api/auth/me/route.ts
// API untuk mendapatkan user yang sedang login dari session cookie
// GET -> { success, user }

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada session aktif' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        team: user.team,
        whatsapp: user.whatsapp,
        role: user.role,
        nip: user.nip,
      },
    });
  } catch (err) {
    console.error('[API Auth Me] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}