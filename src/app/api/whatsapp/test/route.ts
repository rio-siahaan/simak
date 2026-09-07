import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsApp, buildNotificationMessage } from '@/lib/whatsapp';

/**
 * POST /api/whatsapp/test
 * Test koneksi WhatsApp dengan template
 * Body: { phone, activity_id?, user_id?, use_template? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, activity_id, user_id, use_template = true } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Parameter wajib: phone' },
        { status: 400 }
      );
    }

    let message: string;
    let testMeta = { test: true };

    if (use_template && activity_id) {
      // Gunakan template dari notification-templates.ts
      const { data: activity } = await supabase
        .from('activities')
        .select('id, title, team, start_date, deadline, description')
        .eq('id', activity_id)
        .single();

      if (!activity) {
        return NextResponse.json(
          { error: 'Kegiatan tidak ditemukan' },
          { status: 404 }
        );
      }

      let userName = 'Test User';
      if (user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('name')
          .eq('id', user_id)
          .single();
        if (user) userName = user.name;
      }

      // Build message menggunakan template 'created'
      message = buildNotificationMessage(
        'created',
        { ...activity, id: activity_id },
        userName,
        user_id
      );

      testMeta = { activityId: activity_id, userId: user_id, type: 'created', actorName: userName };
    } else {
      message = body.message || 'Test notifikasi SIMAK dari API';
      testMeta = { test: true };
    }

    // Kirim via Fonnte
    const result = await sendWhatsApp(phone, message, testMeta);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      logData: result.logData,
      message_preview: message.substring(0, 200) + '...',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/test
 * Quick test tanpa template
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get('phone');
  const message = searchParams.get('message') || 'Test notifikasi SIMAK';

  if (!phone) {
    return NextResponse.json(
      { error: 'Query param wajib: phone' },
      { status: 400 }
    );
  }

  const result = await sendWhatsApp(phone, message, { test: true });

  return NextResponse.json({
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    logData: result.logData,
  });
}