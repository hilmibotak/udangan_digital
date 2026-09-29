import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB, safeDatabaseError } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db?.admin().ping();
    return NextResponse.json({ success: true, message: "MongoDB berhasil terhubung" });
  } catch (error) {
    const safeMessage = safeDatabaseError(error);
    console.error("MongoDB connection error:", safeMessage);
    const message = safeMessage.includes("MONGODB_URI belum diatur")
      ? "MONGODB_URI belum diatur di .env.local. Isi nilainya lalu restart server Next.js."
      : safeMessage.includes("querySrv")
        ? "Node.js tidak dapat menyelesaikan DNS SRV Atlas. Periksa DNS/VPN/firewall komputer; permintaan belum mencapai MongoDB Atlas."
        : "MongoDB gagal dijangkau. Periksa URI, kredensial, dan Atlas Network Access; detail aman dicatat di terminal server.";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
