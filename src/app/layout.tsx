import type { Metadata, Viewport } from "next";
import { SiteHeader } from "./site-header";
import { FunnelEvents } from "./funnel-events";
import { WebAnalytics } from "./web-analytics";
import { SiteFooter } from "./site-footer";
import { siteUrl } from "@/lib/site";
import { localeBootScript } from "@/lib/locale";
import "./globals.css";
import "./revenue.css";
import "./care.css";
import "./launch.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "StayTag · Nytto Labs", template: "%s · StayTag" },
  description: "Print a QR label that remembers the exact part, last replacement and next due date. Search for a manual. No app. No account.",
  applicationName: "StayTag",
  keywords: ["QR maintenance label", "filter replacement reminder", "return QR wallet", "refill list", "maintenance tag"],
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: localeBootScript }} /></head>
      <body>
        <SiteHeader />
        <FunnelEvents />
        <WebAnalytics />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
