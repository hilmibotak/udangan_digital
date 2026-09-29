import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/wishes?invitationId=... untuk melihat ucapan." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan ucapan harus melalui /api/manage/wishes/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus ucapan melalui /api/manage/wishes/:id dengan invitationId yang valid." }, { status: 400 });
}
