import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICG — Integrated Communications Group",
  description: "Stories, events, and announcements from the PLP community.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
