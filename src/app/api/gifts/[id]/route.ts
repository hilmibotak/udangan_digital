import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan endpoint /api/gifts?invitationId=... untuk melihat hadiah digital." }, { status: 400 });
}

export async function PATCH() {
  return NextResponse.json({ success: false, message: "Perubahan hadiah digital harus melalui /api/manage/gifts/:id dengan invitationId yang valid." }, { status: 400 });
}

export async function DELETE() {
  return NextResponse.json({ success: false, message: "Hapus hadiah digital melalui /api/manage/gifts/:id dengan invitationId yang valid." }, { status: 400 });
}
