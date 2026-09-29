import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Invitation from "@/models/Invitation";
import { DashboardWorkspace } from "@/components/dashboard-workspace";

export const dynamic = "force-dynamic";
const sections = new Set(["couple", "events", "love-story", "gallery", "music", "rsvp", "guests", "wishes", "gifts", "templates", "preview", "settings"]);
export default async function DashboardSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const session = await auth(); if (!session?.user?.id) redirect("/login");
  const { section } = await params; if (!sections.has(section)) notFound();
  await connectDB();
  const items = await Invitation.find({ userId: session.user.id }).sort({ updatedAt: -1 }).select("_id title slug status groom.name bride.name").lean();
  const invitations = items.map((item) => ({ _id: String(item._id), title: item.title, slug: item.slug, status: item.status, template: item.template, groom: item.groom, bride: item.bride }));
  return <DashboardWorkspace section={section} invitations={invitations}/>;
}
