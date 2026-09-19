/** Homepage copy kept in one place so claims stay product-true. */

export const heroCopy = {
  eyebrow: "Care history that stays on the machine",
  titleLead: "Record.",
  titleMid: "Care.",
  titleAccent: "Repeat.",
  body: "Put a care record on the machine. Scan its QR to see the last replacement, exact filter or part and next due date. Add a photo fingerprint without uploading a photo. No app. No account.",
  primaryCta: "Create a free care tag",
  secondaryCta: "Open sample care chain",
  points: ["Free to create", "No app or account", "Any printer · A4 ready", "Data stays in the QR"] as const,
  affiliateNote: "Reorder links can be affiliate links. Same price to you."
} as const;

export const brandsCopy = {
  kicker: "For brands & OEM packaging",
  title: "Put a free reorder QR on the pack.",
  body: "Private-label sellers, exporters and OEMs can print the same CycleTag on a carton, insert or spare-parts bag. Customers scan it later to reopen the exact search and the next replacement date. Create the label here, then print it on your artwork or stick it on the pack.",
  honesty: "No portal, SKU feed or contract. CycleTag does not take orders or stock products. The QR carries its own data — there is no account or database to connect.",
  points: [
    { title: "Same public generator", detail: "Use the form on this page. Choose the model or SKU search you want the customer to open." },
    { title: "Print it yourself", detail: "Download the PNG or print on A4, then place it on the pack. Any ordinary printer works." },
    { title: "Free to add", detail: "Creating and printing the QR costs nothing. If a later purchase goes through the tag’s marketplace link, CycleTag may earn a disclosed commission." }
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
