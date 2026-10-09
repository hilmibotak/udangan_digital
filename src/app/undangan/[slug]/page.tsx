import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import Invitation from "@/models/Invitation";
import Event from "@/models/Event";
import Gallery from "@/models/Gallery";
import Gift from "@/models/Gift";
import Music from "@/models/Music";
import LoveStory from "@/models/LoveStory";
import Wish from "@/models/Wish";
import { PublicInvitation } from "@/components/public-invitation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> }): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  try {
    await connectDB();
    const session = query.preview === "1" ? await auth() : null;
    const filter = query.preview === "1" && session?.user?.id ? { slug, userId: session.user.id } : { slug, status: "published" };
    const item = await Invitation.findOne(filter).select("groom.name bride.name groom.photo groom.photoFileId bride.photo bride.photoFileId").lean();
    if (item) { const title = `${item.groom.name || "Mempelai"} & ${item.bride.name || "Mempelai"} — Wedding Invitation`; const description = `Undangan pernikahan ${item.groom.name || ""} dan ${item.bride.name || ""}.`; const image = item.groom.photoFileId ? `/api/media/${item.groom.photoFileId}` : item.bride.photoFileId ? `/api/media/${item.bride.photoFileId}` : item.groom.photo || item.bride.photo; return { title, description, robots: query.preview === "1" ? { index: false, follow: false } : undefined, openGraph: { title, description, type: "website", ...(image ? { images: [{ url: image, alt: title }] } : {}) } }; }
  } catch { /* Render a friendly unavailable state if the database is temporarily unreachable. */ }
  return { title: "Undangan tidak tersedia" };
}

export default async function PublicInvitationPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string | string[]; preview?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  let item: Awaited<ReturnType<typeof Invitation.findOne>> | null = null;
  let unavailable = false;
  let eventRows: Awaited<ReturnType<typeof Event.find>> = [];
  let galleryRows: Awaited<ReturnType<typeof Gallery.find>> = [];
  let giftRows: Awaited<ReturnType<typeof Gift.find>> = [];
  let musicRow: Awaited<ReturnType<typeof Music.findOne>> = null;
  let storyRows: Awaited<ReturnType<typeof LoveStory.find>> = [];
  let wishRows: Awaited<ReturnType<typeof Wish.find>> = [];
  let wishTotal = 0;
  try {
    await connectDB();
    const session = query.preview === "1" ? await auth() : null;
    const filter = query.preview === "1" && session?.user?.id ? { slug, userId: session.user.id } : { slug, status: "published" };
    item = await Invitation.findOne(filter).lean();
    if (item) {
      const invitationId = item._id;
      [eventRows, galleryRows, giftRows, musicRow, storyRows, wishRows, wishTotal] = await Promise.all([
        Event.find({ invitationId }).sort({ date: 1 }).lean(),
        Gallery.find({ invitationId }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
        Gift.find({ invitationId }).sort({ createdAt: 1 }).lean(),
        Music.findOne({ invitationId, enabled: true }).lean(),
        LoveStory.find({ invitationId }).sort({ sortOrder: 1, year: 1 }).lean(),
        Wish.find({ invitationId, status: "visible" }).sort({ createdAt: -1 }).limit(15).select("guestName message createdAt").lean(),
        Wish.countDocuments({ invitationId, status: "visible" }),
      ]);
    }
  } catch { unavailable = true; }

  if (!item && !unavailable) notFound();
  if (unavailable) return <main className="inv-unavailable"><div><p className="inv-kicker">RUANGJANJI</p><h1>Undangan belum dapat dibuka.</h1><p>Silakan coba kembali beberapa saat lagi.</p></div></main>;

  const toValue = Array.isArray(query.to) ? query.to[0] : query.to;
  const guestName = typeof toValue === "string" ? toValue.trim().slice(0, 100) : "";
  const serializeDate = (value: Date | string | null | undefined) => value ? new Date(value).toISOString() : "";
  const data = {
    groom: { name: item!.groom?.name ?? "", nickname: item!.groom?.nickname ?? "", fatherName: item!.groom?.fatherName ?? "", motherName: item!.groom?.motherName ?? "", birthOrder: item!.groom?.birthOrder ?? "", instagram: item!.groom?.instagram ?? "", photo: mediaUrl(item!.groom?.photoFileId, item!.groom?.photo) },
    bride: { name: item!.bride?.name ?? "", nickname: item!.bride?.nickname ?? "", fatherName: item!.bride?.fatherName ?? "", motherName: item!.bride?.motherName ?? "", birthOrder: item!.bride?.birthOrder ?? "", instagram: item!.bride?.instagram ?? "", photo: mediaUrl(item!.bride?.photoFileId, item!.bride?.photo) },
    template: item!.template,
    eventDate: serializeDate(item!.eventDate),
    quranSurah: item!.quranSurah ?? "", quranVerse: item!.quranVerse ?? "", quranText: item!.quranText ?? "", closingText: item!.closingText ?? "",
    backgroundType: item!.backgroundType ?? "color", backgroundColor: item!.backgroundColor ?? "#f8f8f4", backgroundGradient: item!.backgroundGradient ?? "", backgroundImage: mediaUrl(item!.backgroundFileId, item!.backgroundImage), rsvpEnabled: item!.rsvpEnabled !== false, wishesEnabled: item!.wishesEnabled !== false,
  };
  return <PublicInvitation
    slug={slug} invitation={data} guestName={guestName} isPreview={query.preview === "1"}
    events={eventRows.map((event) => ({ _id: String(event._id), type: event.type, title: event.title, date: serializeDate(event.date), startTime: event.startTime, endTime: event.endTime, venue: event.venue, address: event.address, mapsUrl: event.mapsUrl }))}
    gallery={galleryRows.map((photo) => ({ _id: String(photo._id), imageUrl: mediaUrl(photo.fileId, photo.imageUrl), caption: photo.caption }))}
    gifts={giftRows.map((gift) => ({ _id: String(gift._id), type: gift.type, provider: gift.provider, accountNumber: gift.accountNumber, accountName: gift.accountName, qrImage: mediaUrl(gift.fileId, gift.qrImage) }))}
    music={musicRow ? { title: musicRow.title, artist: musicRow.artist ?? "", audioUrl: mediaUrl(musicRow.fileId, musicRow.audioUrl) } : null}
    stories={storyRows.map((story) => ({ _id: String(story._id), year: story.year, title: story.title, description: story.description, imageUrl: mediaUrl(story.fileId, story.imageUrl) }))}
    initialWishes={wishRows.map((wish) => ({ _id: String(wish._id), guestName: wish.guestName, message: wish.message, createdAt: serializeDate(wish.createdAt) }))}
    totalWishes={wishTotal}
  />;
}

function mediaUrl(fileId: string | undefined, fallback: string | undefined) {
  return fileId ? `/api/media/${fileId}` : fallback ?? "";
}
