import type { Metadata, Viewport } from "next";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CycleTag — Scan. Reorder. Repeat.", template: "%s · CycleTag" },
  description: "Create stateless QR reorder labels and recurring reminders. No account, tag database or tracking cookies.",
  applicationName: "CycleTag",
  keywords: ["QR reorder label", "replacement reminder", "consumables", "maintenance tag"],
  openGraph: {
    type: "website",
    title: "CycleTag — Scan. Reorder. Repeat.",
    description: "A permanent QR label for every thing you replace.",
    siteName: "CycleTag",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CycleTag QR reorder labels for replacement parts"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CycleTag",
    description: "Free QR reorder labels for replacement parts.",
    images: ["/opengraph-image"]
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f1e9" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header no-print">
          <Link href="/" className="brand" aria-label="CycleTag home">
            <span className="brand-mark" aria-hidden="true"><RefreshCcw size={19} strokeWidth={3} /></span>
            CycleTag
          </Link>
          <nav className="header-nav" aria-label="Primary">
            <Link href="/#how">How it works</Link>
            <Link className="header-cta" href="/#create">Create free tag</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer no-print">
          <span>CycleTag runs without accounts, analytics or tracking cookies.</span>
          <nav aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/affiliate">Affiliate disclosure</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
