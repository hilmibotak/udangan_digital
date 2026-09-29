import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/gallery?invitationId=... untuk melihat galeri." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan galeri harus melalui /api/manage/gallery/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus galeri melalui /api/manage/gallery/:id dengan invitationId yang valid." }, { status: 400 });
}
