import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import Event from "@/models/Event";
import { optionalCloudinaryUrl } from "@/lib/validation";
import { getCloudinary } from "@/lib/cloudinary";
type Context = { params: Promise<{ id: string }> };
const personInput = z.object({ name: z.string().trim().max(80).optional(), nickname: z.string().trim().max(80).optional(), fatherName: z.string().trim().max(120).optional(), motherName: z.string().trim().max(120).optional(), birthOrder: z.string().trim().max(40).optional(), instagram: z.string().trim().max(120).optional(), photo: optionalCloudinaryUrl.optional(), photoPublicId: z.string().trim().max(255).optional() }).strict();
const updateSchema = z.object({ title: z.string().trim().max(120).optional(), slug: z.string().trim().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), groom: personInput.optional(), bride: personInput.optional(), eventDate: z.coerce.date().nullable().optional(), quranSurah: z.string().trim().max(100).optional(), quranVerse: z.string().trim().max(40).optional(), quranText: z.string().trim().max(2000).optional(), closingText: z.string().trim().max(1000).optional(), template: z.enum(["elegant", "romantic", "modern", "luxury", "nusantara"]).optional(), status: z.enum(["draft", "published", "archived"]).optional() }).strict();
async function owned(id: string, userId: string) { if (!mongoose.isValidObjectId(id)) return null; await connectDB(); return Invitation.findOne({ _id: id, userId }); }
export async function GET(_request: Request, { params }: Context) { const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Silakan masuk." }, { status: 401 }); try { const { id } = await params; const item = await owned(id, session.user.id); return item ? NextResponse.json({ data: item }) : NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); } catch { return NextResponse.json({ error: "Undangan belum dapat dimuat." }, { status: 503 }); } }
export async function PATCH(request: Request, { params }: Context) { const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Silakan masuk." }, { status: 401 }); const parsed = updateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Data perubahan tidak valid." }, { status: 400 }); try { const { id } = await params; const item = await owned(id, session.user.id); if (!item) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }); if (parsed.data.status === "published") { const groomName = parsed.data.groom?.name ?? item.groom?.name; const brideName = parsed.data.bride?.name ?? item.bride?.name; const mainDate = parsed.data.eventDate === undefined ? item.eventDate : parsed.data.eventDate; const hasEvent = mainDate ? true : Boolean(await Event.exists({ invitationId: item._id })); if (!groomName?.trim() || !brideName?.trim() || !hasEvent) return NextResponse.json({ error: "Lengkapi nama kedua mempelai dan setidaknya satu tanggal atau acara sebelum publikasi." }, { status: 400 }); } item.set(parsed.data); await item.save(); return NextResponse.json({ data: item }); } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === 11000) return NextResponse.json({ error: "Slug sudah digunakan. Pilih tautan lain." }, { status: 409 }); return NextResponse.json({ error: "Perubahan undangan gagal disimpan." }, { status: 503 }); } }
export async function DELETE(_request: Request, { params }: Context) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Silakan masuk." }, { status: 401 });
  try {
    const { id } = await params;
    const item = await owned(id, session.user.id);
    if (!item) return NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 });
    const invitationId = item._id;
    const [eventModel, galleryModel, giftModel, guestModel, storyModel, musicModel, rsvpModel, wishModel] = await Promise.all([import("@/models/Event"), import("@/models/Gallery"), import("@/models/Gift"), import("@/models/Guest"), import("@/models/LoveStory"), import("@/models/Music"), import("@/models/RSVP"), import("@/models/Wish")]);
    const [gallery, stories, gifts, music] = await Promise.all([galleryModel.default.find({ invitationId }).select("publicId").lean(), storyModel.default.find({ invitationId }).select("publicId").lean(), giftModel.default.find({ invitationId }).select("publicId").lean(), musicModel.default.find({ invitationId }).select("publicId").lean()]);
    const mediaPrefix = `ruangjanji/${invitationId}/`;
    const imageIds = [...new Set([item.groom?.photoPublicId, item.bride?.photoPublicId, ...gallery.map((entry) => entry.publicId), ...stories.map((entry) => entry.publicId), ...gifts.map((entry) => entry.publicId)].filter((asset): asset is string => Boolean(asset?.startsWith(mediaPrefix))))];
    const audioIds = [...new Set(music.map((entry) => entry.publicId).filter((asset): asset is string => Boolean(asset?.startsWith(mediaPrefix))))];
    await Promise.all([eventModel.default, galleryModel.default, giftModel.default, guestModel.default, storyModel.default, musicModel.default, rsvpModel.default, wishModel.default].map((model) => model.deleteMany({ invitationId })));
    await item.deleteOne();
    if (imageIds.length || audioIds.length) {
      const cloud = getCloudinary();
      for (const [ids, resourceType] of [[imageIds, "image"], [audioIds, "video"]] as const) {
        for (let index = 0; index < ids.length; index += 10) await Promise.all(ids.slice(index, index + 10).map((publicId) => cloud.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true }).catch(() => null)));
      }
    }
    return NextResponse.json({ data: { deleted: true } });
  } catch { return NextResponse.json({ error: "Undangan gagal dihapus." }, { status: 503 }); }
}
