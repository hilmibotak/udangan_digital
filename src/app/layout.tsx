import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "ruangjanji — Undangan Digital Penuh Cerita", template: "%s | ruangjanji" }, description: "Rancang undangan digital yang terasa personal untuk hari istimewamu." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><body>{children}</body></html>; }
