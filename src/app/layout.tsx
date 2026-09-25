import type { Metadata, Viewport } from "next";
import { SiteHeader } from "./site-header";
import { FunnelEvents } from "./funnel-events";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { contact, contactLinks, operatorLegalLine } from "@/lib/contact";
import "./globals.css";
import "./revenue.css";
import "./care.css";
import "./launch.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "StayTag · Nytto Labs", template: "%s · StayTag" },
  description: "Print a QR label that remembers the exact part, last replacement and next due date. Search for a manual. No app. No account.",
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
    description: "The QR that remembers the part and your care dates.",
    images: ["/opengraph-image"]
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f1e9" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        <FunnelEvents />
        {children}
        <footer className="site-footer no-print">
          <div className="footer-about">
            <span>StayTag runs without accounts or tracking cookies. We count actions without recording tag contents.</span>
            <span><a href={contactLinks.operator}>{contact.operatorName}</a> · {contact.country}.</span>
            <span>{operatorLegalLine}</span>
          </div>
          <nav aria-label="Support and legal">
            <Link href="/support">Support</Link>
            <Link href="/insights">Measurement guide</Link>
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

