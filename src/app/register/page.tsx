import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Buat akun" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return <main className="grid min-h-screen md:grid-cols-2"><aside className="relative hidden overflow-hidden bg-[#34443a] p-12 text-[#f5f3e9] md:flex md:flex-col md:justify-between"><Link className="brand text-white" href="/"><span className="brand-mark !bg-[#f5f3e9] !text-[#34443a]">r.</span>ruangjanji</Link><div className="relative z-10 mb-12 max-w-md"><p className="eyebrow !text-[#c8d0c2]">MULAI DENGAN SATU CERITA</p><h1 className="mt-6 font-serif text-5xl leading-tight">Buat ruang<br/><i className="text-[#c4d0bd]">untuk hari bahagiamu.</i></h1><p className="mt-5 max-w-sm text-sm leading-7 text-[#d0d5ca]">Pilih desain, isi cerita kalian, dan bagikan undangan istimewa dengan mudah.</p></div><span className="text-xs text-[#bbc4b8]">© 2026 ruangjanji</span><div className="absolute -right-32 top-1/4 h-[460px] w-[460px] rounded-full border border-white/10"/></aside><section className="flex items-center justify-center px-6 py-14"><div className="w-full max-w-[390px]"><Link className="brand mb-12 md:hidden" href="/"><span className="brand-mark">r.</span>ruangjanji</Link><div className="eyebrow">SATU LANGKAH MENUJU HARI ISTIMEWA</div><h2 className="mt-3 font-serif text-4xl font-normal tracking-tight">Buat akunmu</h2><p className="mt-3 text-sm text-stone-500">Mulai rancang undangan yang terasa seperti kalian.</p><AuthForm mode="register"/><p className="mt-7 text-center text-sm text-stone-500">Sudah punya akun? <Link className="font-semibold text-[#536c58]" href="/login">Masuk</Link></p></div></section></main>;
}
