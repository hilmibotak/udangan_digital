import mongoose, { type Model } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import Event from "@/models/Event";
import Gallery from "@/models/Gallery";
import Gift from "@/models/Gift";
import Guest from "@/models/Guest";
import LoveStory from "@/models/LoveStory";
import Music from "@/models/Music";
import RSVP from "@/models/RSVP";
import Wish from "@/models/Wish";
import { getCloudinary } from "@/lib/cloudinary";
import { cloudinaryUrl, httpsUrl } from "@/lib/validation";

const resources: Record<string, Model<unknown>> = { events: Event, gallery: Gallery, gifts: Gift, guests: Guest, "love-stories": LoveStory, music: Music, rsvp: RSVP, wishes: Wish };
const mutable: Record<string, string[]> = {
  events: ["type", "title", "date", "startTime", "endTime", "venue", "address", "mapsUrl"],
  gallery: ["imageUrl", "caption", "sortOrder", "publicId"], gifts: ["type", "provider", "accountNumber", "accountName", "qrImage", "publicId"],
  guests: ["name", "phone", "category", "invitationStatus", "rsvpStatus"], "love-stories": ["year", "title", "description", "imageUrl", "publicId", "sortOrder"],
  music: ["title", "artist", "audioUrl", "publicId", "enabled"], rsvp: [], wishes: ["status"],
};
type Context = { params: Promise<{ resource: string; id: string }> };

async function resolve(request: Request, resource: string, rowId: string) {
  const session = await auth();
  if (!session?.user?.id) return { response: NextResponse.json({ error: "Silakan masuk." }, { status: 401 }) };
  if (!mongoose.isValidObjectId(rowId)) return { response: NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 }) };
  const model = resources[resource];
  if (!model) return { response: NextResponse.json({ error: "Bagian tidak ditemukan." }, { status: 404 }) };
  const invitationId = new URL(request.url).searchParams.get("invitationId") ?? "";
  if (!mongoose.isValidObjectId(invitationId)) return { response: NextResponse.json({ error: "Undangan tidak valid." }, { status: 400 }) };
  await connectDB();
  const invitation = await Invitation.exists({ _id: invitationId, userId: session.user.id });
  if (!invitation) return { response: NextResponse.json({ error: "Undangan tidak ditemukan." }, { status: 404 }) };
  const row = await model.findOne({ _id: rowId, invitationId });
  if (!row) return { response: NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 }) };
  return { row, model, invitationId };
}

export async function PATCH(request: Request, { params }: Context) {
  const { resource, id } = await params;
  if (!mutable[resource]) return NextResponse.json({ error: "Bagian tidak ditemukan." }, { status: 404 });
  const input = z.record(z.string(), z.unknown()).safeParse(await request.json().catch(() => null));
  if (!input.success || Object.keys(input.data).some((key) => !mutable[resource].includes(key)) || !Object.keys(input.data).length) return NextResponse.json({ error: "Data perubahan tidak valid." }, { status: 400 });
  for (const key of ["imageUrl", "qrImage", "audioUrl"]) if (typeof input.data[key] === "string" && input.data[key] !== "" && !cloudinaryUrl.safeParse(input.data[key]).success) return NextResponse.json({ error: "Gunakan URL media Cloudinary." }, { status: 400 });
  if (typeof input.data.mapsUrl === "string" && !httpsUrl.safeParse(input.data.mapsUrl).success) return NextResponse.json({ error: "Tautan peta harus menggunakan HTTPS." }, { status: 400 });
  try {
    const result = await resolve(request, resource, id);
    if ("response" in result) return result.response;
    const previousPublicId = result.row.get("publicId");
    result.row.set(input.data);
    await result.row.save();
    const nextPublicId = result.row.get("publicId");
    if (typeof previousPublicId === "string" && previousPublicId && previousPublicId.startsWith(`ruangjanji/${result.invitationId}/`) && previousPublicId !== nextPublicId) {
      try { await getCloudinary().uploader.destroy(previousPublicId, { resource_type: resource === "music" ? "video" : "image", invalidate: true }); } catch { /* The updated Cloudinary asset remains linked and can still be managed later. */ }
    }
    return NextResponse.json({ data: result.row });
  } catch { return NextResponse.json({ error: "Perubahan gagal disimpan." }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: Context) {
  const { resource, id } = await params;
  try {
    const result = await resolve(request, resource, id);
    if ("response" in result) return result.response;
    const publicId = result.row.get("publicId");
    if (typeof publicId === "string" && publicId && publicId.startsWith(`ruangjanji/${result.invitationId}/`) && ["gallery", "love-stories", "gifts", "music"].includes(resource)) {
      try { await getCloudinary().uploader.destroy(publicId, { resource_type: resource === "music" ? "video" : "image", invalidate: true }); } catch { /* Keep record deletion available during a temporary Cloudinary outage. */ }
    }
    await result.row.deleteOne();
    return NextResponse.json({ data: { deleted: true } });
  } catch { return NextResponse.json({ error: "Data gagal dihapus." }, { status: 503 }); }
}
