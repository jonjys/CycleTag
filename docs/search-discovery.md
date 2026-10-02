# StayTag search discovery

Canonical origin: https://staytag.nyttolabs.com. Keep cycletag.eu renewed and its existing permanent redirects intact for printed QR labels and search migration.

## Shipped changes

- Page-specific English titles, descriptions, canonical URLs and Open Graph/Twitter metadata. English remains the default; SV is an explicit saved choice.
- Two prerendered, bilingual guides: `/guides/qr-moving-box-labels` and `/guides/qr-maintenance-labels`. They link to working tools and explain local storage, public QR fields, snapshot updates and actual limits/pricing.
- WebSite, WebApplication, Article and breadcrumb JSON-LD. No invented reviews, ratings, sales or rich-result promises.
- Separate static moving-box share image at `/move/opengraph-image`.
- Both guides in the canonical sitemap and linked from the homepage/footer. Private QR readers remain noindex and outside the sitemap.
- IndexNow waits for the guide URLs and key on production, validates the origin, submits only canonical URLs and bounds network waits. It does not notify Google.
- `/insights` explains Search Console, Vercel events, EPN attribution and actual Stripe payments. Move Pass activations are not unique purchases.

## Owner action: Google

1. In https://search.google.com/search-console verify `nyttolabs.com` as a Domain property using Google's DNS record, or verify the StayTag HTTPS URL-prefix property with its supplied method. Use the authoritative DNS provider; domain registration at another provider does not determine DNS management.
2. Submit https://staytag.nyttolabs.com/sitemap.xml. Inspect the home, Move and guide URLs and request indexing. Never submit QR contents, query payloads or fragments.
3. If not already done, use Change of Address from the verified cycletag.eu property when Google offers it, verifying the old and new properties. Keep redirects and old-domain renewal.
4. After indexing, compare impressions, clicks, queries and landing pages over 28 days. Separately check Vercel tool usage and successful Stripe payments. A zero `site:` result alone is not a reliable index diagnosis.

Search Console is not connected in this execution environment. Submission to Google and ranking cannot be claimed. IndexNow acceptance is a notification, not proof of indexing. Technical SEO makes useful content crawlable; it cannot establish search demand or guarantee sales.
