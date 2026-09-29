import { redirect } from "next/navigation";

export default function LegacyCreateUndanganPage() {
  redirect("/dashboard/invitations/create");
}
