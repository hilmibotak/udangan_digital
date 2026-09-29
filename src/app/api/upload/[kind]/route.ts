import { NextResponse } from "next/server";
import { z } from "zod";
import { getCloudinary } from "@/lib/cloudinary";
import { findOwnedInvitation } from "@/lib/owned-invitation";

export const runtime = "nodejs";
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_AUDIO = 10 * 1024 * 1024;
const IMAGE_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const AUDIO_TYPES = new Map([["audio/mpeg", "mp3"], ["audio/mp3", "mp3"], ["audio/wav", "wav"], ["audio/x-wav", "wav"], ["audio/wave", "wav"]]);
function hasExpectedSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (type === "image/webp") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "audio/wav" || type === "audio/x-wav" || type === "audio/wave") return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WAVE";
  if (type === "audio/mpeg" || type === "audio/mp3") return bytes.toString("ascii", 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  return false;
}

export async function POST(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "image" && kind !== "audio") return NextResponse.json({ error: "Jenis unggahan tidak didukung." }, { status: 404 });
  const maxSize = kind === "image" ? MAX_IMAGE : MAX_AUDIO;
  const bodyLength = Number(request.headers.get("content-length") || 0);
  if (bodyLength > maxSize + 64 * 1024) return NextResponse.json({ error: kind === "image" ? "Ukuran foto maksimal 5 MB." : "Ukuran audio maksimal 10 MB." }, { status: 413 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "File tidak dapat dibaca." }, { status: 400 }); }
  const parsed = z.object({ invitationId: z.string().min(1), file: z.instanceof(File) }).safeParse({ invitationId: form.get("invitationId"), file: form.get("file") });
  if (!parsed.success) return NextResponse.json({ error: "Pilih file dan undangan terlebih dahulu." }, { status: 400 });
  const { invitationId, file } = parsed.data;
  const isImage = kind === "image";
  const types = isImage ? IMAGE_TYPES : AUDIO_TYPES;
  if (file.size === 0 || file.size > maxSize || !types.has(file.type)) {
    return NextResponse.json({ error: isImage ? "Gunakan JPG, PNG, atau WEBP maksimal 5 MB." : "Gunakan MP3 atau WAV maksimal 10 MB." }, { status: 400 });
  }
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasExpectedSignature(file.type, bytes)) return NextResponse.json({ error: "Isi file tidak sesuai dengan format yang dipilih." }, { status: 400 });
    const owned = await findOwnedInvitation(invitationId);
    if ("response" in owned) return owned.response;
    const cloud = getCloudinary();
    const folder = `ruangjanji/${owned.invitationId}/${kind}`;
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloud.uploader.upload_stream({ folder, resource_type: isImage ? "image" : "video", format: types.get(file.type), ...(isImage ? { transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto", fetch_format: "auto" }] } : {}) }, (error, uploaded) => {
        if (error || !uploaded) reject(error ?? new Error("Upload gagal."));
        else resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
      });
      stream.end(bytes);
    });
    return NextResponse.json({ data: { url: result.secure_url, publicId: result.public_id } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload gagal. Periksa koneksi Cloudinary dan coba lagi." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const parsed = z.object({ invitationId: z.string().min(1), publicId: z.string().trim().min(1).max(255), kind: z.enum(["image", "audio"]).default("image") }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Data penghapusan tidak valid." }, { status: 400 });
  try {
    const owned = await findOwnedInvitation(parsed.data.invitationId);
    if ("response" in owned) return owned.response;
    if (!parsed.data.publicId.startsWith(`ruangjanji/${owned.invitationId}/`)) return NextResponse.json({ error: "Media tidak ditemukan pada undangan ini." }, { status: 404 });
    const cloud = getCloudinary();
    await cloud.uploader.destroy(parsed.data.publicId, { resource_type: parsed.data.kind === "audio" ? "video" : "image", invalidate: true });
    return NextResponse.json({ data: { deleted: true } });
  } catch { return NextResponse.json({ error: "Media belum dapat dihapus." }, { status: 503 }); }
}
