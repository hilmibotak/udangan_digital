import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { InvitationCreateForm } from "@/components/invitation-create-form";
export const metadata = { title: "Buat undangan" };
export default async function CreateInvitationPage() { const session = await auth(); if (!session?.user?.id) redirect("/login"); return <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:px-10"><Link className="text-sm text-stone-500" href="/dashboard">← Kembali ke dashboard</Link><p className="eyebrow mt-8">LANGKAH PERTAMA</p><h1 className="mt-3 font-serif text-4xl">Mulai cerita kalian.</h1><p className="mt-3 text-sm text-stone-500">Buat draft terlebih dahulu. Nama dan desain dapat diubah kapan saja.</p><InvitationCreateForm/></main>; }
