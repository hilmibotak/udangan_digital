import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import RSVP from "@/models/RSVP";

const schema = z.object({
  guestName: z.string().trim().min(2).max(100).optional(),
  attendance: z.enum(["attending", "not_attending", "maybe"]).optional(),
  guestCount: z.coerce.number().int().min(0).max(20).optional(),
  message: z.string().trim().max(1000).optional(),
}).strict();

async function findOwnedRsvp(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const item = await RSVP.findById(id).lean();
  if (!item) return null;
  const invitation = await Invitation.exists({ _id: item.invitationId, userId });
  return invitation ? item : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await findOwnedRsvp(id, session.user.id);
    if (!item) return NextResponse.json({ success: false, message: "Konfirmasi tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Konfirmasi RSVP belum dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await RSVP.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Konfirmasi tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });

    const payload = schema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return NextResponse.json({ success: false, message: "Data RSVP tidak valid." }, { status: 400 });
    Object.entries(payload.data).forEach(([key, value]) => {
      if (value !== undefined) item.set(key, value);
    });
    await item.save();
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Konfirmasi RSVP gagal disimpan." }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(request, { params });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await RSVP.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Konfirmasi tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    await item.deleteOne();
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, message: "Konfirmasi RSVP gagal dihapus." }, { status: 500 });
  }
}
