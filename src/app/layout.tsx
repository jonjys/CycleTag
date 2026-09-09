import type { Metadata, Viewport } from "next";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { contact, contactLinks } from "@/lib/contact";
import { starterSheetPrice } from "@/lib/commerce";
import "./globals.css";
import "./revenue.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "CycleTag — Scan. Reorder. Repeat.", template: "%s · CycleTag" },
  description: "Create stateless QR reorder labels and recurring reminders. No account, tag database or tracking cookies.",
  applicationName: "CycleTag",
  keywords: ["QR reorder label", "replacement reminder", "consumables", "maintenance tag"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "CycleTag — Scan. Reorder. Repeat.",
    description: "A permanent QR label for every thing you replace. Scan. Reorder. Repeat.",
    siteName: "CycleTag",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CycleTag - Scan. Reorder. Repeat."
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CycleTag — Scan. Reorder. Repeat.",
    description: "The reorder label that never forgets. Free QR reorder labels for replacement parts.",
    images: ["/opengraph-image"]
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f1e9" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <header className="site-header no-print">
          <Link href="/" className="brand" aria-label="CycleTag home">
            <span className="brand-mark" aria-hidden="true"><RefreshCcw size={19} strokeWidth={3} /></span>
            CycleTag
          </Link>
          <nav className="header-nav" aria-label="Primary">
            <Link href="/#tags">My tags</Link>
            <Link className="header-optional" href="/#how">How it works</Link>
            <Link className="header-optional" href="/#brands">For brands</Link>
            <Link className="header-optional" href="/bulk">Bulk</Link>
            <Link className="header-cta" href="/#starter">Starter {starterSheetPrice}</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer no-print">
          <div className="footer-about">
            <span>CycleTag runs without accounts, analytics or tracking cookies.</span>
            <span>A product by <a href={contactLinks.operator}>{contact.operatorName}</a>, operated by {contact.operatorPerson}, {contact.country}. {contact.fTaxStatus}.</span>
          </div>
          <nav aria-label="Support and legal">
            <Link href="/support">Support</Link>
            <a href={contactLinks.general}>Contact</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/affiliate">Affiliate disclosure</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
