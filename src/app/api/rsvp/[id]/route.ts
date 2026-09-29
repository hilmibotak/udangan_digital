import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/rsvp?invitationId=... untuk melihat RSVP." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan RSVP harus melalui endpoint yang sesuai untuk undangan ini." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus RSVP tidak diizinkan untuk data status publik." }, { status: 400 });
}
