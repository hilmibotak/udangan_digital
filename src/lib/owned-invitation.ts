import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";

export async function findOwnedInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { response: NextResponse.json({ success: false, message: "Silakan masuk." }, { status: 401 }) } as const;
  if (!mongoose.isValidObjectId(invitationId)) return { response: NextResponse.json({ success: false, message: "ID undangan tidak valid." }, { status: 400 }) } as const;
  await connectDB();
  const invitation = await Invitation.findOne({ _id: invitationId, userId: session.user.id }).select("_id").lean();
  if (!invitation) return { response: NextResponse.json({ success: false, message: "Undangan tidak ditemukan." }, { status: 404 }) } as const;
  return { invitationId: invitation._id, userId: session.user.id } as const;
}

export const apiFailure = (message: string, status = 503) => NextResponse.json({ success: false, message }, { status });
export const apiSuccess = <T,>(data: T, status = 200) => NextResponse.json({ success: true, data }, { status });
