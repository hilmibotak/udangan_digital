import { z } from "zod";
import Gallery from "@/models/Gallery";
import { apiFailure, apiSuccess, findOwnedInvitation } from "@/lib/owned-invitation";
import { cloudinaryUrl } from "@/lib/validation";
const schema = z.object({ invitationId: z.string(), imageUrl: cloudinaryUrl, publicId: z.string().trim().min(1).max(255), caption: z.string().trim().max(240).default(""), sortOrder: z.coerce.number().int().min(0).default(0) }).strict();
export async function GET(request: Request) { try { const id = new URL(request.url).searchParams.get("invitationId") ?? ""; const owned = await findOwnedInvitation(id); if ("response" in owned) return owned.response; return apiSuccess(await Gallery.find({ invitationId: owned.invitationId }).sort({ sortOrder: 1 }).lean()); } catch { return apiFailure("Galeri belum dapat dimuat."); } }
export async function POST(request: Request) { const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return apiFailure("Data galeri tidak valid.", 400); try { const owned = await findOwnedInvitation(input.data.invitationId); if ("response" in owned) return owned.response; return apiSuccess(await Gallery.create({ ...input.data, invitationId: owned.invitationId }), 201); } catch { return apiFailure("Foto galeri gagal disimpan."); } }
