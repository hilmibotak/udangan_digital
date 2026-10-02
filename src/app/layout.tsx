import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : process.env.NODE_ENV === "development" ? new URL("http://localhost:3000") : undefined, title: { default: "ruangjanji — Undangan Digital Penuh Cerita", template: "%s | ruangjanji" }, description: "Rancang undangan digital yang terasa personal untuk hari istimewamu." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
