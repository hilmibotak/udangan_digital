import { z } from "zod";
import LoveStory from "@/models/LoveStory";
import { apiFailure, apiSuccess, findOwnedInvitation } from "@/lib/owned-invitation";
import { optionalCloudinaryUrl } from "@/lib/validation";

const schema = z.object({ invitationId: z.string(), year: z.coerce.number().int().min(1900).max(2200), title: z.string().trim().min(1).max(120), description: z.string().trim().min(1).max(1000), imageUrl: optionalCloudinaryUrl.default(""), publicId: z.string().trim().max(255).default(""), sortOrder: z.coerce.number().int().min(0).default(0) }).strict();

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("invitationId") ?? "";
    const owned = await findOwnedInvitation(id);
    if ("response" in owned) return owned.response;
    return apiSuccess(await LoveStory.find({ invitationId: owned.invitationId }).sort({ sortOrder: 1, year: 1 }).lean());
  } catch { return apiFailure("Cerita perjalanan belum dapat dimuat."); }
}

export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return apiFailure("Data cerita perjalanan tidak valid.", 400);
  try {
    const owned = await findOwnedInvitation(input.data.invitationId);
    if ("response" in owned) return owned.response;
    return apiSuccess(await LoveStory.create({ ...input.data, invitationId: owned.invitationId }), 201);
  } catch { return apiFailure("Cerita perjalanan gagal disimpan."); }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const invitationId = url.searchParams.get("invitationId") ?? "";
  try {
    const owned = await findOwnedInvitation(invitationId);
    if ("response" in owned) return owned.response;
    const deleted = await LoveStory.findOneAndDelete({ _id: id, invitationId: owned.invitationId });
    return deleted ? apiSuccess({ deleted: true }) : apiFailure("Cerita tidak ditemukan.", 404);
  } catch { return apiFailure("Cerita perjalanan gagal dihapus."); }
}
