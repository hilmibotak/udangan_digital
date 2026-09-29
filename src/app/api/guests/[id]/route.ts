import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Guest from "@/models/Guest";
import Invitation from "@/models/Invitation";

const schema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(32).optional(),
  category: z.string().trim().max(80).optional(),
  invitationStatus: z.enum(["pending", "sent"]).optional(),
  rsvpStatus: z.enum(["pending", "attending", "not_attending", "maybe"]).optional(),
}).strict();

async function findOwnedGuest(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const item = await Guest.findById(id).lean();
  if (!item) return null;
  const invitation = await Invitation.exists({ _id: item.invitationId, userId });
  return invitation ? item : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await findOwnedGuest(id, session.user.id);
    if (!item) return NextResponse.json({ success: false, message: "Tamu tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Daftar tamu belum dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await Guest.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Tamu tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });

    const payload = schema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return NextResponse.json({ success: false, message: "Data tamu tidak valid." }, { status: 400 });
    Object.entries(payload.data).forEach(([key, value]) => {
      if (value !== undefined) item.set(key, value);
    });
    await item.save();
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Tamu gagal disimpan." }, { status: 500 });
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
    const item = await Guest.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Tamu tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    await item.deleteOne();
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, message: "Tamu gagal dihapus." }, { status: 500 });
  }
}
