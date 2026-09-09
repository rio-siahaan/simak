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
      description,
      evidence_url,
    } = body;

    // Catat status lama dulu: dipakai untuk menghindari notifikasi "selesai"
    // yang ganda kalau kegiatan yang sama berulang kali di-set completed.
    const { data: beforeActivity } = await supabase
      .from("activities")
      .select("status")
      .eq("id", id)
      .single();
    const wasCompleted = beforeActivity?.status === "completed";

    // Validasi tanggal jika diubah
    if (deadline && start_date && new Date(deadline) < new Date(start_date)) {
      return NextResponse.json(
        { error: "Deadline tidak boleh lebih awal dari tanggal mulai" },
        { status: 400 }
      );
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

    // 🔔 Notifikasi "kegiatan selesai" — hanya dikirim saat status BERUBAH
    // menjadi completed (bukan saat edit data lain / re-save yang sama).
    if (data && status === "completed" && !wasCompleted) {
      try {
        const { notifyActor } = await import("@/lib/whatsapp");
        const { data: actorUser } = await supabase
          .from("users")
          .select("id, name, whatsapp")
          .eq("id", data.actor_id)
          .single();

        if (actorUser?.whatsapp) {
          await notifyActor({
            activity_id: data.id,
            user_id: actorUser.id,
            type: "completed",
            user: actorUser as { id: string; name: string; whatsapp: string },
            activity: {
              id: data.id,
              title: data.title,
              team: data.team,
              start_date: data.start_date,
              deadline: data.deadline,
              description: data.description,
              evidence_url: data.evidence_url,
            },
          });
        }
      } catch (err) {
        console.error("[WhatsApp] Gagal kirim notifikasi selesai:", err);
      }
    }

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
