import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ registered?: string }> }) {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  const { registered } = await searchParams;

  return <main className="grid min-h-screen md:grid-cols-2"><aside className="relative hidden overflow-hidden bg-[#34443a] p-12 text-[#f5f3e9] md:flex md:flex-col md:justify-between"><Link className="brand text-white" href="/"><span className="brand-mark !bg-[#f5f3e9] !text-[#34443a]">r.</span>ruangjanji</Link><div className="relative z-10 mb-12 max-w-md"><p className="eyebrow !text-[#c8d0c2]">HARI ISTIMEWA, CERITA SELAMANYA</p><h1 className="mt-6 font-serif text-5xl leading-tight">Kisah indahmu<br/><i className="text-[#c4d0bd]">dimulai di sini.</i></h1><p className="mt-5 max-w-sm text-sm leading-7 text-[#d0d5ca]">Simpan semua detail hari istimewa dalam satu ruang yang dibuat dengan sepenuh hati.</p></div><span className="text-xs text-[#bbc4b8]">© 2026 ruangjanji</span><div className="absolute -right-32 top-1/4 h-[460px] w-[460px] rounded-full border border-white/10"/><div className="absolute -right-20 top-[30%] h-[360px] w-[360px] rounded-full border border-white/10"/></aside><section className="flex items-center justify-center px-6 py-14"><div className="w-full max-w-[390px]"><Link className="brand mb-14 md:hidden" href="/"><span className="brand-mark">r.</span>ruangjanji</Link><div className="eyebrow">SELAMAT DATANG KEMBALI</div><h2 className="mt-3 font-serif text-4xl font-normal tracking-tight">Masuk ke akunmu</h2><p className="mt-3 text-sm text-stone-500">Lanjutkan merancang cerita hari istimewamu.</p><AuthForm mode="login" successMessage={registered === "1" ? "Registrasi berhasil. Silakan login dengan akun yang baru dibuat." : undefined}/><p className="mt-7 text-center text-sm text-stone-500">Belum punya akun? <Link className="font-semibold text-[#536c58]" href="/register">Daftar sekarang</Link></p></div></section></main>;
}
