import { z } from "zod";
import Wish from "@/models/Wish";
import { apiFailure, apiSuccess, findOwnedInvitation } from "@/lib/owned-invitation";
const schema = z.object({ invitationId: z.string(), guestName: z.string().trim().min(2).max(100), message: z.string().trim().min(2).max(1000) }).strict();
export async function GET(request: Request) { try { const id = new URL(request.url).searchParams.get("invitationId") ?? ""; const owned = await findOwnedInvitation(id); if ("response" in owned) return owned.response; return apiSuccess(await Wish.find({ invitationId: owned.invitationId }).sort({ createdAt: -1 }).lean()); } catch { return apiFailure("Ucapan belum dapat dimuat."); } }
export async function POST(request: Request) { const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return apiFailure("Data ucapan tidak valid.", 400); try { const owned = await findOwnedInvitation(input.data.invitationId); if ("response" in owned) return owned.response; return apiSuccess(await Wish.create({ ...input.data, invitationId: owned.invitationId }), 201); } catch { return apiFailure("Ucapan gagal disimpan."); } }
