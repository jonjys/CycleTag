# CycleTag

**A stateless QR reorder label for every consumable.**

CycleTag turns a replacement item, interval and marketplace search into a printable QR label and recurring calendar event. The QR carries its own state. A scan reconstructs the reorder page without an account, database, cookie or external API.

## The machine

1. A user creates a tag for toner, filters, bags, descaler or another repeat purchase.
2. CycleTag encodes the item, exact search, interval, start date and market in a URL-fragment payload that browsers do not send to the server.
3. The user prints the QR next to the physical item and optionally adds the recurring calendar event.
4. Every later scan opens the same reorder page and calculates the next replacement locally.
5. The user deliberately clicks a disclosed eBay marketplace link.
6. If a public EPN campaign ID is configured, a qualifying purchase can earn commission.

The physical label and calendar event are the distribution loop: an output from the first visit creates future visits at the moment of recurring purchase intent.

## Money flow

`replacement event → €0 upstream cost → local schedule + marketplace routing → qualifying eBay purchase → category commission`

eBay states that EPN partners receive a percentage of Gross Merchandise Bought for qualifying transactions. Its published guidance describes category rates generally ranging from 1% to 6%, with marketplace/category rules and caps.

Example, not a guarantee: a qualifying €40 replacement at 1–6% produces €0.40–€2.40 gross commission. CycleTag has no per-transaction API or database cost. Hosting and tax are excluded.

- Rate card: https://partnernetwork.ebay.com/our-program/rate-card
- Commission explanation: https://partnernetwork.ebay.com/solutions/step-1-understanding-cookies-commissions-and-getting-paid
- Tracking-link format: https://developer.ebay.com/api-docs/buy/static/ref-epn-link.html
- Disclosure requirements: https://partnernetwork.ebay.com/resources/affiliate-disclosure-faq

## Privacy model

- No database
- No accounts or login
- No cookies or analytics
- No server-side secrets
- No product or identity API
- No automatic orders
- Tags are deliberately `noindex`

The tag payload is visible to anyone who has the URL or QR, but new tags keep it after `#` so it is not included in HTTP requests. The UI tells users not to enter confidential information.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript strict mode
- `qrcode` for in-browser PNG generation
- Vitest
- Vercel-compatible static/serverless deployment

## Configuration

Copy the example file:

```bash
cp .env.example .env.local
```

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Optional override | No | Canonical origin and sitemap; defaults to the live Vercel URL |
| `NEXT_PUBLIC_EBAY_CAMPAIGN_ID` | Optional override | No | Public EPN campaign ID; defaults to CycleTag campaign `5339198614` |

CycleTag ships with its public EPN campaign ID `5339198614`. An invalid override falls back to an ordinary marketplace search and clearly reports that affiliate tracking is inactive.

## Run and verify

```bash
npm ci
npm run verify
npm run dev
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"status":"ok","service":"cycletag","storage":"none","secrets":"none"}
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Generator, presets, printable label and calendar download |
| `/tag#d=…` | Stateless scan/reorder page; legacy `/tag?d=…` links remain readable |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |
| `/affiliate` | Affiliate disclosure |
| `/api/health` | Cacheable health response |

## Safety and failure behaviour

- Schema validation rejects damaged, oversized or altered tag payloads.
- User strings are rendered as text, never HTML.
- Marketplace hosts and tracking parameters are selected from a fixed allowlist.
- An invalid campaign ID fails to an ordinary, non-affiliate search.
- A damaged QR opens a recovery screen rather than redirecting.
- Calendar and QR generation happen only after explicit user action.
- Marketplace purchase requires a visible user click and opens on the marketplace itself.
- CSP, clickjacking, content-type, referrer and browser-permission headers are set globally.

## Affiliate activation

The owner must apply to eBay Partner Network, receive a campaign ID and ensure CycleTag is an approved promotional method. Acceptance, attribution and earnings are controlled by eBay and are not guaranteed by this repository.

No API key is needed. The campaign ID is a public tracking identifier embedded in outbound links.
