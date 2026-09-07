import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Ambil detail user berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "User tidak ditemukan", details: error.message },
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

// PATCH - Update user berdasarkan ID (hanya Admin)
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

    console.log(`[API Users PATCH] User: ${userName} (${userRole}, NIP: ${userNip}) updating user ${(await params).id}`);

    const { id } = await params;
    const body = await request.json();
    const { name, team, whatsapp, role, nip } = body;

    // Validasi format WhatsApp jika diubah
    if (whatsapp && !whatsapp.startsWith("+62")) {
      return NextResponse.json(
        { error: "Nomor WhatsApp harus dimulai dengan +62" },
        { status: 400 }
      );
    }

    // Validasi NIP jika disediakan
    if (nip !== undefined && nip !== null && nip.length < 10) {
      return NextResponse.json(
        { error: "NIP minimal 10 digit" },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (team) updateData.team = team;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (role) updateData.role = role;
    if (nip !== undefined) updateData.nip = nip;

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Gagal mengupdate user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data, message: "User berhasil diupdate" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Hapus user berdasarkan ID (hanya Admin)
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

    console.log(`[API Users DELETE] User: ${userName} (${userRole}, NIP: ${userNip}) deleting user ${(await params).id}`);

    const { id } = await params;
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Gagal menghapus user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "User berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
