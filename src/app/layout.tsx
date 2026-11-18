import type { Metadata } from "next";
import "./globals.css";
import { siteOrigin } from "@/lib/auth";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "ICG — Integrated Communications Group",
  description: "Stories, events, and announcements from the PLP community.",
  robots: {
    index: process.env.ICG_ALLOW_INDEXING === "true",
    follow: process.env.ICG_ALLOW_INDEXING === "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
