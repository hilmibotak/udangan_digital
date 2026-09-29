import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/love-stories?invitationId=... untuk melihat love story." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan love story harus melalui /api/manage/love-stories/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus love story melalui /api/manage/love-stories/:id dengan invitationId yang valid." }, { status: 400 });
}
