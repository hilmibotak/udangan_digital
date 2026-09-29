import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB, safeDatabaseError } from "@/lib/mongodb";
import User from "@/models/User";

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254), password: z.string().min(8).max(72) });
export async function POST(request: Request) {
  try {
    const input = schema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: "Periksa kembali nama, email, dan kata sandi (minimal 8 karakter)." }, { status: 400 });
    await connectDB();
    const email = input.data.email.toLowerCase();
    if (await User.exists({ email })) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    const user = await User.create({ name: input.data.name, email, password: await bcrypt.hash(input.data.password, 12) });
    return NextResponse.json({ success: true, message: "Registrasi berhasil", data: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    const message = safeDatabaseError(error);
    console.error("Registration failed:", message);
    if (message.includes("MONGODB_URI belum diatur")) {
      return NextResponse.json({ error: "Pendaftaran belum tersedia karena server belum dikonfigurasi untuk MongoDB." }, { status: 503 });
    }
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }
    return NextResponse.json({ error: "Pendaftaran gagal karena database belum dapat diakses. Coba lagi nanti." }, { status: 503 });
  }
}
