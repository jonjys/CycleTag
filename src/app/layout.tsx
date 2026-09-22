import type { Metadata, Viewport } from "next";
import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { contact, contactLinks, operatorLegalLine } from "@/lib/contact";
import "./globals.css";
import "./revenue.css";
import "./care.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "StayTag · Nytto Labs", template: "%s · StayTag" },
  description: "Print a QR label that remembers the exact part, last replacement and next due date. Manual attached. No app. No account.",
  applicationName: "StayTag",
  keywords: ["QR reorder label", "replacement reminder", "consumables", "maintenance tag"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "StayTag · Nytto Labs",
    description: "Never search for the same replacement part twice. Scan the sticker on the machine.",
    siteName: "StayTag",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "StayTag · Nytto Labs"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "StayTag · Nytto Labs",
    description: "The QR that remembers the part, the date and the manual.",
    images: ["/opengraph-image"]
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f1e9" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <header className="site-header no-print">
          <Link href="/" className="brand" aria-label="StayTag home">
            <span className="brand-mark" aria-hidden="true"><RefreshCcw size={19} strokeWidth={3} /></span>
            StayTag
            <span className="header-optional" style={{ marginLeft: 8, fontWeight: 500, opacity: 0.65 }}>cycletag.eu</span>
          </Link>
          <nav className="header-nav" aria-label="Primary">
            <Link className="header-optional" href="/#how">How it works</Link>
            <Link className="header-optional" href="/#sheet">Care Sheet</Link>
            <Link className="header-cta" href="/#create">Create label</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer no-print">
          <div className="footer-about">
            <span>StayTag runs without accounts, analytics or tracking cookies.</span>
            <span><a href={contactLinks.operator}>{contact.operatorName}</a> · {contact.country}.</span>
            <span>{operatorLegalLine}</span>
          </div>
          <nav aria-label="Support and legal">
            <Link href="/support">Support</Link>
            <a href={contactLinks.general}>Contact</a>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/affiliate">Affiliate disclosure</Link>
            <Link href="/bulk">Bulk</Link>
            <Link href="/spaces">Spaces</Link>
            <Link href="/relay">Refill Relay</Link>
            <Link href="/sellers">Seller Kits</Link>
          </nav>
        </footer>
      </body>
    </html>
  );
}
