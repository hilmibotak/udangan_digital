"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode, successMessage }: { mode: "login" | "register"; successMessage?: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      if (isRegister) {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Pendaftaran gagal.");

        router.replace("/login?registered=1");
        router.refresh();
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (!result?.ok) throw new Error("Email atau kata sandi tidak sesuai.");

      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-8 space-y-5">
    {isRegister && <label className="field-label">Nama lengkap<input name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Nama Anda" className="field-input" /></label>}
    <label className="field-label">Email<input name="email" required type="email" autoComplete="email" placeholder="nama@email.com" className="field-input" /></label>
    <label className="field-label">Kata sandi<input name="password" required minLength={8} maxLength={72} type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Minimal 8 karakter" className="field-input" /></label>
    {successMessage && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="button-primary w-full disabled:opacity-60">{busy ? "Mohon tunggu…" : isRegister ? "Buat akun" : "Masuk"}</button>
  </form>;
}
