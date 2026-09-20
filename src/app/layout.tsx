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
  title: { default: "CycleTag Care Proof · Nytto Labs", template: "%s · CycleTag" },
  description: "Care history on the machine: exact part, last replacement and next due. Free QR tags. No account or database.",
  applicationName: "CycleTag",
  keywords: ["QR reorder label", "replacement reminder", "consumables", "maintenance tag"],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "CycleTag Care Proof · Nytto Labs",
    description: "A care snapshot on the machine. Scan the maintenance chain; log the next replacement.",
    siteName: "CycleTag",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CycleTag Care Proof · Nytto Labs"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CycleTag Care Proof · Nytto Labs",
    description: "Care stays with the machine. Last replaced, exact part, next due.",
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
            <Link href="/sellers">Seller Kits</Link>
            <Link href="/relay">Refill Relay</Link>
            <Link href="/spaces">Spaces</Link>
            <Link href="/#tags">My tags</Link>
            <Link className="header-optional" href="/#how">How it works</Link>
            <Link className="header-optional" href="/bulk">Bulk</Link>
            <Link className="header-cta" href="/#create">Create care tag</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer no-print">
          <div className="footer-about">
            <span>CycleTag runs without accounts, analytics or tracking cookies.</span>
            <span><a href={contactLinks.operator}>{contact.operatorName}</a> · {contact.country}.</span>
            <span>{operatorLegalLine}</span>
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
