/** Homepage copy kept in one place so claims stay product-true. */

export const heroCopy = {
  eyebrow: "StayTag · Nytto Labs",
  titleLead: "Never search for",
  titleMid: "the same part",
  titleAccent: "twice.",
  body: "Print a QR label that remembers the exact part, last replacement and next due date — and opens the user manual when you scan. No app. No account.",
  primaryCta: "Create a free label",
  secondaryCta: "See the scan result",
  points: ["No app", "No account", "Manual attached automatically", "Print on A4"] as const,
  affiliateNote: "Buy links are optional and last. Same price to you if a marketplace link is used."
} as const;

export const brandsCopy = {
  kicker: "On your product",
  title: "Put a reorder QR on the pack.",
  body: "Private-label sellers and OEMs can print the same StayTag on a carton or spare-parts bag. Customers scan it later to see the exact part and the next replacement date.",
  honesty: "No portal, SKU feed or contract. StayTag does not take orders or stock products. The QR carries its own data — there is no account or database to connect.",
  points: [
    { title: "Same public generator", detail: "Use the form on this page. The buy link is optional and comes last." },
    { title: "Print it yourself", detail: "Download the PNG or print on A4, then place it on the pack." },
    { title: "Free to add", detail: "Creating and printing the QR costs nothing. If a later purchase goes through the tag’s marketplace link, StayTag may earn a disclosed commission." }
  ] as const,
  cta: "Create a pack label"
} as const;

const inventedFeatureClaims = [
  "connect via api",
  "requires an account",
  "create an account",
  "sign up",
  "brand dashboard",
  "sku feed integration",
  "white-label portal"
] as const;

export function homepageCopyInventedClaims(): string[] {
  const haystack = [
    heroCopy.eyebrow,
    heroCopy.body,
    heroCopy.primaryCta,
    ...heroCopy.points,
    brandsCopy.kicker,
    brandsCopy.title,
    brandsCopy.body,
    brandsCopy.honesty,
    brandsCopy.cta,
    ...brandsCopy.points.flatMap((point) => [point.title, point.detail])
  ]
    .join(" ")
    .toLowerCase();

  return inventedFeatureClaims.filter((term) => haystack.includes(term));
}
