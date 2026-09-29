import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import LoveStory from "@/models/LoveStory";
import { optionalCloudinaryUrl } from "@/lib/validation";

const schema = z.object({
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(1000).optional(),
  imageUrl: optionalCloudinaryUrl.optional(),
  publicId: z.string().trim().max(255).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
}).strict();

async function findOwnedStory(id: string, userId: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  const item = await LoveStory.findById(id).lean();
  if (!item) return null;
  const invitation = await Invitation.exists({ _id: item.invitationId, userId });
  return invitation ? item : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await findOwnedStory(id, session.user.id);
    if (!item) return NextResponse.json({ success: false, message: "Cerita tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Cerita perjalanan belum dapat dimuat." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 });

  try {
    const { id } = await params;
    const item = await LoveStory.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Cerita tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });

    const payload = schema.safeParse(await request.json().catch(() => null));
    if (!payload.success) return NextResponse.json({ success: false, message: "Data cerita perjalanan tidak valid." }, { status: 400 });
    Object.entries(payload.data).forEach(([key, value]) => {
      if (value !== undefined) item.set(key, value);
    });
    await item.save();
    return NextResponse.json({ success: true, data: item });
  } catch {
    return NextResponse.json({ success: false, message: "Cerita perjalanan gagal disimpan." }, { status: 500 });
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
    const item = await LoveStory.findById(id);
    if (!item) return NextResponse.json({ success: false, message: "Cerita tidak ditemukan." }, { status: 404 });
    const invitation = await Invitation.exists({ _id: item.invitationId, userId: session.user.id });
    if (!invitation) return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    await item.deleteOne();
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, message: "Cerita perjalanan gagal dihapus." }, { status: 500 });
  }
}
