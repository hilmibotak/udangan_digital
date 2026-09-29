import { redirect } from "next/navigation";

type LegacyParams = { params: Promise<{ id: string }> };

export default async function LegacyInvitationPage({ params }: LegacyParams) {
  const { id } = await params;
  redirect(`/dashboard/invitations/${id}`);
}
