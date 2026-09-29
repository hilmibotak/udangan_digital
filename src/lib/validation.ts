import { z } from "zod";

export const cloudinaryUrl = z.url().refine((value) => {
  try { const url = new URL(value); return url.protocol === "https:" && url.hostname === "res.cloudinary.com"; }
  catch { return false; }
}, "Gunakan URL media Cloudinary yang aman.");

export const optionalCloudinaryUrl = z.union([cloudinaryUrl, z.literal("")]);

export const httpsUrl = z.union([z.url().refine((value) => {
  try { return new URL(value).protocol === "https:"; }
  catch { return false; }
}, "Gunakan tautan HTTPS."), z.literal("")]);
