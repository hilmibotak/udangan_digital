import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/guests?invitationId=... untuk melihat daftar tamu." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan tamu harus melalui /api/manage/guests/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus tamu melalui /api/manage/guests/:id dengan invitationId yang valid." }, { status: 400 });
}
