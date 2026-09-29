import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudinary } from "@/lib/cloudinary";
import { findOwnedInvitation } from "@/lib/owned-invitation";

export async function GET() {
  return NextResponse.json({ success: false, message: "Gunakan /api/upload/image atau /api/upload/audio untuk upload media." }, { status: 400 });
}

export async function DELETE(request: Request) {
  const parsed = z
    .object({
      invitationId: z.string().min(1),
      publicId: z.string().trim().min(1).max(255),
      kind: z.enum(["image", "audio"]).default("image"),
    })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Data penghapusan media tidak valid." }, { status: 400 });
  }

  const owned = await findOwnedInvitation(parsed.data.invitationId);
  if ("response" in owned) return owned.response;

  const publicId = parsed.data.publicId;
  if (!publicId.startsWith(`ruangjanji/${owned.invitationId}/`)) {
    return NextResponse.json({ success: false, message: "Media tidak ditemukan pada undangan ini." }, { status: 404 });
  }

  try {
    await getCloudinary().uploader.destroy(publicId, {
      resource_type: parsed.data.kind === "audio" ? "video" : "image",
      invalidate: true,
    });
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch {
    return NextResponse.json({ success: false, message: "Media belum dapat dihapus." }, { status: 503 });
  }
}
