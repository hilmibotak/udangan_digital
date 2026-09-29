import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { httpsUrl } from "@/lib/validation";
import EventModel from "@/models/Event";
import Invitation from "@/models/Invitation";

const schema = z.object({
  type: z.enum(["akad", "reception", "other"]).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  date: z.coerce.date().optional(),
  startTime: z.string().trim().min(1).max(20).optional(),
  endTime: z.string().trim().max(20).optional(),
  venue: z.string().trim().min(1).max(160).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  mapsUrl: httpsUrl.optional(),
}).strict();

async function findOwnedEvent(eventId: string, userId: string) {
  if (!mongoose.isValidObjectId(eventId)) return null;
  await connectDB();
  const event = await EventModel.findById(eventId).lean();
  if (!event) return null;
  const invitation = await Invitation.exists({ _id: event.invitationId, userId });
  if (!invitation) return null;
  return event;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const event = await findOwnedEvent(id, session.user.id);
    if (!event) return NextResponse.json({ success: false, message: "Acara tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, data: event });
  } catch {
    return NextResponse.json({ success: false, message: "Acara belum dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleWrite(request, params, false);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleWrite(request, params, false);
}

async function handleWrite(request: Request, params: Promise<{ id: string }>, isDelete: boolean) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const event = await EventModel.findById(id);
    if (!event) return NextResponse.json({ success: false, message: "Acara tidak ditemukan." }, { status: 404 });

    const invitation = await Invitation.exists({ _id: event.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });

    if (isDelete) {
      await event.deleteOne();
      return NextResponse.json({ success: true, data: { deleted: true } });
    }

    const payload = schema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return NextResponse.json({ success: false, message: "Data acara tidak valid." }, { status: 400 });

    Object.entries(payload.data).forEach(([key, value]) => {
      if (value !== undefined) event.set(key, value);
    });
    await event.save();
    return NextResponse.json({ success: true, data: event });
  } catch {
    return NextResponse.json({ success: false, message: "Acara gagal disimpan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const event = await EventModel.findById(id);
    if (!event) return NextResponse.json({ success: false, message: "Acara tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: event.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    await event.deleteOne();
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, message: "Acara gagal dihapus." }, { status: 500 });
  }
}
