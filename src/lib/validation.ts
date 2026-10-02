import { z } from "zod";

export const httpsUrl = z.union([z.url().refine((value) => {
  try { return new URL(value).protocol === "https:"; }
  catch { return false; }
}, "Gunakan tautan HTTPS."), z.literal("")]);

export const mediaUrl = z.string().refine((value) => {
  try {
    const url = new URL(value, "http://local");
    return url.pathname.startsWith("/api/media/") && url.pathname.length > "/api/media/".length;
  } catch {
    return false;
  }
}, "Gunakan URL media yang valid.");

export const optionalMediaUrl = z.union([mediaUrl, httpsUrl, z.literal("")]);
