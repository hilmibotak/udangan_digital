import { z } from "zod";
import Gift from "@/models/Gift";
import { apiFailure, apiSuccess, findOwnedInvitation } from "@/lib/owned-invitation";
import { optionalMediaUrl } from "@/lib/validation";
const schema = z.object({ invitationId: z.string(), type: z.enum(["bank", "ewallet", "qris"]), provider: z.string().trim().min(1).max(100), accountNumber: z.string().trim().max(100).default(""), accountName: z.string().trim().max(100).default(""), qrImage: optionalMediaUrl.default(""), fileId: z.string().trim().max(50).default("") }).strict();
export async function GET(request: Request) { try { const id = new URL(request.url).searchParams.get("invitationId") ?? ""; const owned = await findOwnedInvitation(id); if ("response" in owned) return owned.response; return apiSuccess(await Gift.find({ invitationId: owned.invitationId }).lean()); } catch { return apiFailure("Hadiah digital belum dapat dimuat."); } }
export async function POST(request: Request) { const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return apiFailure("Data hadiah digital tidak valid.", 400); try { const owned = await findOwnedInvitation(input.data.invitationId); if ("response" in owned) return owned.response; return apiSuccess(await Gift.create({ ...input.data, invitationId: owned.invitationId }), 201); } catch { return apiFailure("Hadiah digital gagal disimpan."); } }
