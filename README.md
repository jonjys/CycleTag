# StayTag (formerly CycleTag)

**Live: https://staytag.nyttolabs.com** — `cycletag.eu` permanently 308-redirects there, keeping path, query and `#fragment`, so every printed QR keeps working. `www.cycletag.eu` currently takes a 307 hop via the former apex first. Keep `cycletag.eu` registered indefinitely. `/api/*` is still served on the legacy host.

**Put memory where the thing is.** Care labels for machines, a refill list, Spaces and a private Return Wallet — no account, no app, no tag database.

## Return Wallet (`/returns`)

Save return QR codes from any web shop once; show them full-screen at the counter. Screenshot upload (decoded on-device with jsQR, plus BarcodeDetector for 1D barcodes where available), paste, camera scan or typed code. Store, item, return-by date, amount, drop-off and note. Countdown (calm → “2 days left” → “Return today”), lifecycle Ready → Dropped off → Refund pending → Refunded (or Kept it), money-still-owed total, calendar reminder (.ics with 7/3/1-day and same-day alarms, no code in the file), JSON backup/import, history. Metadata lives in `localStorage` (`staytag.returns.v1`), screenshots in IndexedDB. Nothing is uploaded; links inside codes are only opened by an explicit tap and only for https.

## One-tap replacement

The scan page leads with status (“Overdue — 6 days”, “Replacement due in 3 days”, “Next replacement: 28 days”) and a single **I replaced it today** button. It issues the new QR in place with history carried over (oldest entries roll off only if the sticker is full, with a notice), saves to My tags, and offers print / PNG / reminder. `/#log=` links keep working.

## Measurement

Allowlisted action names only (`src/lib/measurement.ts`): page_view, label_started, label_created, tag_scanned, replacement_logged, refill_added, relay_shared, space_created, return_wallet_opened, return_added, return_code_opened, return_dropped_off, return_refunded, return_reminder_added, print/download/outbound counts. No names, codes, URLs, amounts or part numbers.

**Care Proof: the care history that stays on the machine.**

The main landing, create and scan flows now lead with last replacement, exact item / optional part number, next due and an optional locally calculated photo hash. Log a replacement to issue a new QR containing the previous entries. Old stickers remain snapshots. No photo upload, account or database is added.

`/care-sheet` provides a free 12-up A4 print preview plus a duration schedule, saved as PDF through the browser print dialog. There is no paid Care Sheet checkout. Marketplace search remains an optional secondary action with affiliate disclosure. See [Care Proof demo and limitations](docs/care-proof.md).

## StayTag Move (`/move`)

Create and print eight moving-box labels free. Move Pass costs SEK 79 once; foreign-currency amounts in the UI are estimates and Stripe shows the checkout total. The active Payment Link sells StayTag Move Pass, never a Care Sheet or voluntary support.

New passes unlock only after the server confirms a completed, **paid** Stripe Checkout Session from the Move Pass link. Unpaid, wrong-product and `no_payment_required` sessions do not unlock. During an outage an existing verified pass stays usable; an unverified reference remains pending and is retried on the next visit. Existing move data and printable QR labels remain intact. A restricted Stripe key with Checkout Sessions: Read is recommended.

The verification route stream-limits bodies to 512 bytes and uses a bounded per-instance rate limit without retaining raw IP addresses or session IDs. Distributed abuse protection still needs Vercel Firewall configuration. Local storage is device-local convenience, not tamper-proof DRM or a cross-device entitlement system.

Required follow-up for reliable payment fulfillment: signed Stripe webhook handling for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, gated on paid status, plus a recovery/entitlement design. Current on-demand Stripe checks reject pending payments and allow a later retry; they do not provide durable event-driven fulfillment if a buyer never returns. Do not describe that integration as complete or enable new asynchronous fulfillment until this is implemented.

The sections below document the original reorder tools and infrastructure, which remain available for compatibility.

CycleTag turns a replacement item, interval and marketplace search into a printable QR label and recurring calendar event. The QR carries its own state. A scan reconstructs the reorder page without an account, database, cookie or external API.

## The machine

1. A user creates a tag for toner, filters, bags, descaler or another repeat purchase.
2. CycleTag encodes the item, exact search, interval, start date and market in a URL-fragment payload that browsers do not send to the server.
3. The user prints the QR next to the physical item and optionally adds the recurring calendar event.
4. Every later scan opens the same reorder page and calculates the next replacement locally.
5. The user deliberately clicks a disclosed eBay marketplace link.
6. If a public EPN campaign ID is configured, a qualifying purchase can earn commission.

The physical label and calendar event are the repeat-use loop: an output from the first visit creates future visits at the moment of recurring purchase intent. Every printed label also names `staytag.nyttolabs.com` (older labels name `cycletag.eu`, which redirects). The scan page can correct a typo and print a new label, or create another tag. Tags created in the browser can also be kept in a local “My tags” list so they can be reopened or reprinted on that device. The list never leaves the browser.

Correcting a tag is a re-issue, not an in-place edit. CycleTag has no database, so an already-printed QR is a snapshot: scanning it still opens the original name, search and interval. The replacement QR is a new payload in a new URL fragment. Cover or discard the old sticker after you print the new one. Legacy `/#clone=…` builder links still prefill the same form as `/#edit=…`.

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
- No tracking cookies; allowlisted action counts contain no QR or personal fields
- Care labels require no server-side secrets; paid Move Pass verification uses a server-only Stripe key
- No product or identity API
- No automatic orders
- Optional on-device “My tags” list in the browser only; never uploaded
- Tags are deliberately `noindex`

The tag payload is visible to anyone who has the URL or QR, but new tags keep it after `#` so it is not included in HTTP requests. The create, share and print flows preview the encoded fields and warn users not to enter confidential information. Shopping regions map to one disclosed eBay marketplace each — Europe / Nordics currently opens eBay.de.

## Stack

- Next.js 16 App Router
- React 19 + TypeScript strict mode
- `qrcode` for in-browser PNG generation
- Vitest
- Vercel-compatible static/serverless deployment

## Configuration

Free labels require no environment variable. Move Pass verification requires `STRIPE_SECRET_KEY` in the server environment. The production origin is `https://staytag.nyttolabs.com` and the public EPN campaign ID ships in the repository.

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_EBAY_CAMPAIGN_ID` | Optional override | No | Public EPN campaign ID; defaults to CycleTag campaign `5339198614` |
| `STRIPE_SECRET_KEY` | For Move Pass | Yes | Prefer a restricted key with Checkout Sessions: Read; never expose it with a `NEXT_PUBLIC_` prefix |

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
| `/#tags` | Local list of tags created on this device |
| `/#print=…` | Regenerates a saved label for printing |
| `/reorder-label/[slug]` | Twelve indexable, prefilled QR tools for high-intent replacement searches |
| `/tag#d=…` | Stateless scan/reorder page; legacy `/tag?d=…` links remain readable |
| `/#edit=…` | Prefills the homepage builder to re-issue a corrected label; `/#clone=…` remains an alias |
| `/returns` | Return Wallet (local-only) |
| `/move`, `/box#d=…` | Local moving-box planner and stateless box labels |
| `/api/move/verify` | Same-origin, uncached Stripe payment verification |
| `/relay` | Refill Relay shopping list |
| `/spaces`, `/space#d=…` | One QR for a room |
| `/sellers`, `/reorder#kit=…` | Seller Kits |
| `/privacy` | Privacy policy |
| `/terms` | Terms of use |
| `/affiliate` | Affiliate disclosure |
| `/api/health` | Cacheable health response |

## Automatic discovery

- The Verify GitHub Action runs lint, all unit tests and the production build for pull requests and main pushes. Configure `verify` as a required status check if branch protection should block merges automatically.

- The homepage links to the focused label tools.
- `/sitemap.xml` lists every public generator on the canonical domain.
- `/robots.txt` advertises the sitemap while excluding private tag payload and API routes.
- A secret-free GitHub Action reads the live sitemap after each production push and submits its URLs to IndexNow.
- Google Search Console only needs the sitemap submitted once; Google can then recrawl it automatically.

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

## Search discovery

See [search-discovery.md](docs/search-discovery.md) for the canonical URLs, Search Console setup and the distinction between search clicks, app usage and actual payments.
