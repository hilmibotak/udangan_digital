import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteFileFromGridFS, getFileFromGridFS, parseGridFSFileId } from "@/lib/gridfs";
import { findOwnedInvitation } from "@/lib/owned-invitation";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ success: true, message: "Upload API aktif.", storage: "mongodb-gridfs" });
}

export async function DELETE(request: Request) {
  const parsed = z.object({
    invitationId: z.string().min(1),
    fileId: z.string().trim().min(1).max(50),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Data penghapusan media tidak valid." }, { status: 400 });

  try {
    const owned = await findOwnedInvitation(parsed.data.invitationId);
    if ("response" in owned) return owned.response;
    const fileId = parseGridFSFileId(parsed.data.fileId);
    if (!fileId) return NextResponse.json({ success: false, message: "Media tidak ditemukan." }, { status: 404 });
    const file = await getFileFromGridFS(fileId);
    if (!file || String(file.metadata?.invitationId) !== String(owned.invitationId) || file.metadata?.userId !== owned.userId) {
      return NextResponse.json({ success: false, message: "Media tidak ditemukan pada undangan ini." }, { status: 404 });
    }
    await deleteFileFromGridFS(fileId);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/upload error:", error);
    return NextResponse.json({ success: false, message: "Media belum dapat dihapus." }, { status: 500 });
  }
}
