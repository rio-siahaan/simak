import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsApp, notifyActor } from '@/lib/whatsapp';

/**
 * GET /api/test-whatsapp
 * Test koneksi WhatsApp Fonnte
 * Query params:
 * - phone: nomor WhatsApp (default: admin test)
 * - message: pesan test
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get('phone') || '6281234567890';
  const message = searchParams.get('message') || 'Test notifikasi SIMAK';

  try {
    // Test kirim pesan langsung
    const result = await sendWhatsApp(phone, message);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      details: {
        phone,
        message,
        apiKey: process.env.WHATSAPP_API_KEY ? '✅ Set' : '❌ Not set',
        apiUrl: process.env.WHATSAPP_API_URL || 'https://api.fonnte.com/send',
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}

/**
 * POST /api/test-whatsapp
 * Test notifikasi lengkap ke activity tertentu
 * Body: { activity_id, user_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { activity_id, user_id } = body;

    if (!activity_id || !user_id) {
      return NextResponse.json({
        error: 'Parameter wajib: activity_id, user_id',
      }, { status: 400 });
    }

    // Ambil data kegiatan
    const { data: activity, error: actError } = await supabase
      .from('activities')
      .select('id, title, team, start_date, deadline, description')
      .eq('id', activity_id)
      .single();

    if (actError || !activity) {
      return NextResponse.json({
        error: 'Kegiatan tidak ditemukan',
        details: actError,
      }, { status: 404 });
    }

    // Ambil data user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, whatsapp')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User tidak ditemukan',
        details: userError,
      }, { status: 404 });
    }

    // Kirim notifikasi
    const result = await notifyActor({
      activity_id: activity.id,
      user_id: user.id,
      type: 'created',
      user: user,
      activity: activity,
    });

    return NextResponse.json({
      success: result.success,
      notificationId: result.notificationId,
      error: result.error,
      details: {
        activity: activity.title,
        user: user.name,
        whatsapp: user.whatsapp,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Internal server error',
      details: String(error),
    }, { status: 500 });
  }
}
