import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { heroCopy } from "@/lib/home-copy";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { HomeGenerator } from "./home-generator";
import { TagShelf } from "./tag-shelf";
import { ToolDirectory } from "./tool-directory";
import { CareTimeline } from "./care-timeline";

export const metadata: Metadata = { alternates: { canonical: "/" }, openGraph: { type: "website", url: "/", title: "CycleTag Care Proof · Nytto Labs", description: "The care history that stays on the machine. Last replaced, exact part, next due." } };
const sample: TagPayload = { v: 1, n: "Coffee machine water filter", q: "DeLonghi DLSC002 water filter", c: "coffee", i: 60, s: "2026-09-01", m: "DE", care: { part: "DLSC002", marketplace: true, history: [{ n: "Coffee machine water filter", part: "DLSC002", s: "2026-07-03", i: 60 }] } };

export default async function Home() {
  const url = buildTagUrl(siteUrl, sample);
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 560, margin: 4 });
  return <main>
    <section className="hero care-hero">
      <div className="hero-message">
        <div className="eyebrow">NYTTO LABS / CYCLETAG CARE PROOF</div>
        <h1>Care stays<br />with the<br /><em>machine.</em></h1>
        <p className="hero-copy">{heroCopy.body}</p>
        <div className="hero-actions"><a className="primary-button" href="#create">Create a free care tag</a><a className="secondary-button" href={url}>See a care chain</a></div>
        <div className="hero-points">{heroCopy.points.map(point => <span key={point}>{point}</span>)}</div>
        <p className="hero-affiliate">Self-reported records, carried in the QR. No account or database.</p>
      </div>
      <div className="care-demo">
        <div className="section-kicker">EXAMPLE CARE SNAPSHOT</div><h2>Coffee machine filter</h2><CareTimeline tag={sample} />
        <a href={url} className="care-demo-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Scan the sample care history" width={160} height={160} /><span>Scan the care chain.<br />Exact part. Last change. Next due.</span>
        </a>
      </div>
    </section>
    <HomeGenerator />
    <section className="bulk-offer no-print" id="sheet" aria-labelledby="care-sheet-title">
      <div className="bulk-offer-copy"><div className="section-kicker">CARE SHEET / COMING SOON</div><h2 id="care-sheet-title">12 tags.<br />One care sheet.</h2><p>Planned package: €19 for 12 care tags plus a duration PDF showing last replacement, interval and next due date. Print a 12-up A4 sheet for the machines you look after.</p><Link className="primary-button" href="/care-sheet">Try the free print preview</Link></div>
      <div className="bulk-card"><strong>€19 · 12 tags + duration PDF</strong><p>The paid package is not available to purchase yet. This preview runs locally and is free. No payment is taken.</p><ul><li>Care fields on each sticker</li><li>12-up layout on ordinary A4</li><li>Save the sheet and schedule as PDF from your browser</li></ul><p>Paper and physical stickers are not included.</p></div>
    </section>
    <TagShelf />
    <section className="how-it-works no-print" id="how">
      <div className="loop-heading"><div><div className="section-kicker">A RECORD YOU CAN LEAVE WITH THE MACHINE</div><h2>Record. Stick.<br />Scan. Care.</h2></div><p>Every new replacement adds an entry to a new QR. Printed stickers keep their original history.</p></div>
      <div className="steps"><article><b>01</b><h3>Record</h3><p>Exact item, part number, last replacement and interval.</p></article><article><b>02</b><h3>Stick</h3><p>Print the QR and place it on the machine.</p></article><article><b>03</b><h3>Scan</h3><p>Read its care chain and next due date.</p></article><article><b>04</b><h3>Care again</h3><p>Log a replacement, print a new QR and cover the old sticker.</p></article></div>
    </section>
    <section className="purchase-faq no-print"><h2>Know what your sticker records.</h2>
      <details><summary>Does Care Proof verify that maintenance happened?</summary><p>No. Entries are self-reported and editable. A photo fingerprint can identify the original file, but is not a trusted timestamp, technician signature or certification.</p></details>
      <details><summary>Will old stickers update?</summary><p>No. Each QR is a snapshot. Log a replacement or correct a detail to create a new QR. Old stickers and shared links stay unchanged. Each chain holds up to six entries within the QR size limit; keep the old snapshot when starting a new chain.</p></details>
      <details><summary>Where does my photo go?</summary><p>Nowhere. SHA-256 runs on your device. Only the hash goes into the QR and local My tags shelf. Keep your original photo yourself.</p></details>
      <details><summary>Can I still find a replacement?</summary><p>Yes. Enable the optional marketplace button. It opens an eBay search after you choose to click it. Europe / Nordics uses eBay.de. Check compatibility and availability yourself. Links may earn CycleTag an affiliate commission. <Link href="/affiliate">Read the disclosure.</Link></p></details>
    </section>
    <ToolDirectory />
    <section className="purchase-faq no-print"><h2>Existing CycleTag tools</h2><p>Still available: <Link href="/bulk">Bulk labels</Link> · <Link href="/spaces">Spaces</Link> · <Link href="/relay">Refill Relay</Link> · <Link href="/sellers">Seller Kits</Link></p></section>
    <section className="privacy-strip no-print"><strong>No database. No account.</strong><p>Anyone with the QR or link can read all encoded care entries, dates, part numbers and photo hashes. Never include confidential or personal information. My tags stays in this browser.</p></section>
  </main>;
}
