import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { deleteFileFromGridFS, getFileFromGridFS, getGridFSBucket, parseGridFSFileId } from "@/lib/gridfs";
import Invitation from "@/models/Invitation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function findAccessibleFile(id: string) {
  const fileId = parseGridFSFileId(id);
  if (!fileId) return { response: NextResponse.json({ error: "Media tidak ditemukan." }, { status: 404 }) };
  const file = await getFileFromGridFS(fileId);
  if (!file) return { response: NextResponse.json({ error: "Media tidak ditemukan." }, { status: 404 }) };

  await connectDB();
  const invitationId = file.metadata?.invitationId;
  const invitation = invitationId
    ? await Invitation.findById(invitationId).select("_id userId status").lean()
    : null;
  if (!invitation) return { response: NextResponse.json({ error: "Media tidak ditemukan." }, { status: 404 }) };

  const session = await auth();
  const isOwner = session?.user?.id && String(invitation.userId) === session.user.id;
  if (invitation.status !== "published" && !isOwner) {
    return { response: NextResponse.json({ error: "Media tidak ditemukan." }, { status: 404 }) };
  }
  return { file, fileId, invitation };
}

export async function GET(_request: Request, { params }: Context) {
  try {
    const result = await findAccessibleFile((await params).id);
    if ("response" in result) return result.response;
    const bucket = await getGridFSBucket();
    const stream = bucket.openDownloadStream(result.fileId);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": result.file.metadata?.mimeType || "application/octet-stream",
        "Content-Length": String(result.file.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET /api/media/[id] error:", error);
    return NextResponse.json({ error: "Media belum dapat dimuat." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const result = await findAccessibleFile((await params).id);
    if ("response" in result) return result.response;
    const session = await auth();
    if (!session?.user?.id || String(result.invitation.userId) !== session.user.id) {
      return NextResponse.json({ error: "Kamu tidak memiliki akses ke media ini." }, { status: 403 });
    }
    await deleteFileFromGridFS(result.fileId);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error("DELETE /api/media/[id] error:", error);
    return NextResponse.json({ error: "Media belum dapat dihapus." }, { status: 500 });
  }
}
