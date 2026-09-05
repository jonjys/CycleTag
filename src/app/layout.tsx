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
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"]
  }
};
