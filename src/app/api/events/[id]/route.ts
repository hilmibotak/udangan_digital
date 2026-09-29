import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/events?invitationId=... untuk melihat data acara." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan acara harus melalui /api/events dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus acara melalui /api/manage/events/:id dengan invitationId yang valid." }, { status: 400 });
}
