import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Ambil detail kegiatan berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Kegiatan tidak ditemukan", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Update kegiatan berdasarkan ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ambil user info dari middleware headers untuk audit trail
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role');
    const userNip = request.headers.get('x-user-nip');

    console.log(`[API Activities PATCH] User: ${userName} (${userRole}, NIP: ${userNip}) updating activity ${(await params).id}`);

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      team,
      team_color,
      actor_id,
      actor_name,
      start_date,
      deadline,
      status,
      progress,
      description,
      evidence_url,
    } = body;

    // Validasi tanggal jika diubah
    if (deadline && start_date && new Date(deadline) < new Date(start_date)) {
      return NextResponse.json(
        { error: "Deadline tidak boleh lebih awal dari tanggal mulai" },
        { status: 400 }
      );
    }

    // Cek apakah evidence_url baru diisi (untuk trigger notifikasi)
    const isEvidenceNewlyUploaded = evidence_url !== undefined && evidence_url !== null && evidence_url !== '';

    // Ambil data kegiatan sebelum update untuk cek evidence_url lama
    let oldEvidenceUrl: string | null = null;
    if (isEvidenceNewlyUploaded) {
      const { data: oldActivity } = await supabase
        .from("activities")
        .select("evidence_url")
        .eq("id", id)
        .single();
      oldEvidenceUrl = oldActivity?.evidence_url || null;
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (team !== undefined) updateData.team = team;
    if (team_color !== undefined) updateData.team_color = team_color;
    if (actor_id !== undefined) updateData.actor_id = actor_id;
    if (actor_name !== undefined) updateData.actor_name = actor_name;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;
    if (description !== undefined) updateData.description = description;
    if (evidence_url !== undefined) updateData.evidence_url = evidence_url;

    const { data, error } = await supabase
      .from("activities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Gagal mengupdate kegiatan", details: error.message },
        { status: 500 }
      );
    }

    // TIDAK ada notifikasi evidence_uploaded lagi untuk hemat kuota Fonnte
    // Link bukti dukung sudah diberikan di notifikasi 'created' pertama kali

    return NextResponse.json(
      { data, message: "Kegiatan berhasil diupdate" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Hapus kegiatan berdasarkan ID (hanya Admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ambil user info dari middleware headers untuk audit trail
    const userId = request.headers.get('x-user-id');
    const userName = request.headers.get('x-user-name');
    const userRole = request.headers.get('x-user-role');
    const userNip = request.headers.get('x-user-nip');

    console.log(`[API Activities DELETE] User: ${userName} (${userRole}, NIP: ${userNip}) deleting activity ${(await params).id}`);

    const { id } = await params;
    
    // Hapus notifikasi terkait terlebih dahulu (cascade)
    await supabase
      .from("notifications")
      .delete()
      .eq("activity_id", id);

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Gagal menghapus kegiatan", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Kegiatan berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
