import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";

export async function findPublicInvitation(slug: string, request: Request) {
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const session = preview ? await auth() : null;
  const filter = preview && session?.user?.id
    ? { slug, userId: session.user.id }
    : { slug, status: "published" };

  await connectDB();
  const invitation = await Invitation.findOne(filter).select("_id").lean();
  if (!invitation) {
    return {
      response: NextResponse.json({ success: false, message: "Undangan tidak ditemukan." }, { status: 404 }),
    } as const;
  }
  return { invitation } as const;
}
