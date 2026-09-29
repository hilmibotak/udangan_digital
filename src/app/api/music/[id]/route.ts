import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/music?invitationId=... untuk melihat musik." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan musik harus melalui /api/manage/music/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus musik melalui /api/manage/music/:id dengan invitationId yang valid." }, { status: 400 });
}
