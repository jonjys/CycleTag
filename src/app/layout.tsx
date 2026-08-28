import type { Metadata, Viewport } from "next";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://cycletag.vercel.app";

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
    url: siteUrl,
    siteName: "CycleTag"
  },
  twitter: { card: "summary", title: "CycleTag", description: "Scan. Reorder. Repeat." }
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
          <span className="header-note">No account. No tag database.</span>
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
