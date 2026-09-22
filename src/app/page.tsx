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

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "StayTag · Nytto Labs",
    description: "Never search for the same replacement part twice. Scan the sticker on the machine."
  }
};

const sample: TagPayload = {
  v: 1,
  n: "Coffee machine water filter",
  q: "DeLonghi DLSC002 water filter",
  c: "coffee",
  i: 60,
  s: "2026-09-01",
  m: "US",
  care: { part: "DLSC002", marketplace: false, history: [{ n: "Coffee machine water filter", part: "DLSC002", s: "2026-07-03", i: 60 }] }
};

const waitlistMailto =
  "mailto:hello@nyttolabs.com?subject=StayTag%20Care%20Sheet%20launch%20list&body=Put%20me%20on%20the%20list%20for%20the%20%E2%82%AC14%20launch%20price%20(12%20tags).";

export default async function Home() {
  const url = buildTagUrl(siteUrl, sample);
  const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 560, margin: 4 });
  return (
    <main>
      <section className="hero care-hero">
        <div className="hero-message">
          <div className="eyebrow">STAYTAG · NYTTO LABS</div>
          <h1>
            Never search for
            <br />
            the same part
            <br />
            <em>twice.</em>
          </h1>
          <p className="hero-copy">{heroCopy.body}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#create">
              Create a free label
            </a>
            <a className="secondary-button" href={url}>
              See the scan result
            </a>
          </div>
          <div className="hero-points">
            {heroCopy.points.map((point) => (
              <span key={point}>{point}</span>
            ))}
          </div>
          <p className="hero-affiliate">Self-reported records, carried in the QR. No account or database.</p>
        </div>
        <div className="care-demo">
          <div className="section-kicker">THE RESULT, NOT THE FORM</div>
          <h2>Coffee machine filter</h2>
          <CareTimeline tag={sample} />
          <a href={url} className="care-demo-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Scan the sample StayTag" width={160} height={160} />
            <span>
              Scan the sticker.
              <br />
              Exact part. Next due. Manual.
            </span>
          </a>
        </div>
      </section>
      <HomeGenerator />
      <section className="bulk-offer no-print" id="sheet" aria-labelledby="care-sheet-title">
        <div className="bulk-offer-copy">
          <div className="section-kicker">CARE SHEET · LAUNCH LIST</div>
          <h2 id="care-sheet-title">
            12 tags.
            <br />
            One sheet.
          </h2>
          <p>
            Planned package: 12 QR labels plus a schedule with last replacement, interval and next due date. First 100
            customers pay €14 instead of €19.
          </p>
          <a className="primary-button" href={waitlistMailto}>
            Join the launch list
          </a>
          <Link href="/care-sheet" style={{ display: "inline-block", marginTop: 12 }}>
            Try the free print preview
          </Link>
        </div>
        <div className="bulk-card">
          <strong>€14 · first 100 · then €19</strong>
          <p>Paper and physical stickers are not included. No payment is taken now.</p>
          <ul>
            <li>PDF with 12 QR labels</li>
            <li>Space for part number and model</li>
            <li>Next due date</li>
            <li>Print-ready A4</li>
          </ul>
        </div>
      </section>
      <TagShelf />
      <section className="how-it-works no-print" id="how">
        <div className="loop-heading">
          <div>
            <div className="section-kicker">HOW IT WORKS</div>
            <h2>
              Record. Stick.
              <br />
              Scan. Stay.
            </h2>
          </div>
          <p>Each QR is a snapshot. When you replace a part, print a new label and cover the old sticker.</p>
        </div>
        <div className="steps">
          <article>
            <b>01</b>
            <h3>Record</h3>
            <p>Exact item, part number, last replacement and interval.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Stick</h3>
            <p>Print the QR and place it on the machine.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Scan</h3>
            <p>Read the part, next due date, and open the manual.</p>
          </article>
          <article>
            <b>04</b>
            <h3>Stay</h3>
            <p>Log a replacement, print a new QR and cover the old sticker.</p>
          </article>
        </div>
      </section>
      <section className="purchase-faq no-print">
        <h2>What the sticker actually records</h2>
        <details>
          <summary>How does the manual get attached?</summary>
          <p>
            Automatically. When you scan, StayTag looks up the user guide from the name and part number. No files are
            stored with us. You can open a PDF search, manuals.plus or ManualsLib.
          </p>
        </details>
        <details>
          <summary>Does StayTag prove maintenance happened?</summary>
          <p>No. Entries are self-reported. StayTag does not certify maintenance.</p>
        </details>
        <details>
          <summary>Will old stickers update?</summary>
          <p>
            No. Each QR is a snapshot. Create a new label with the right details and cover the old sticker. StayTag has
            no database to update.
          </p>
        </details>
        <details>
          <summary>Where does my photo go?</summary>
          <p>
            Nowhere. If you add a photo fingerprint it is computed on your device. Only a fingerprint can go into the QR.
            Keep the original photo yourself.
          </p>
        </details>
        <details>
          <summary>Why eBay and not a Swedish shop?</summary>
          <p>
            The buy link is optional and comes last. Leave it off, paste a local shop URL, or use a Google search. eBay.com
            is one option, not the product. Links may earn StayTag a commission. <Link href="/affiliate">Read the disclosure.</Link>
          </p>
        </details>
      </section>
      <ToolDirectory />
      <section className="privacy-strip no-print">
        <strong>No database. No account.</strong>
        <p>
          Tag contents are encoded in the QR link, not uploaded to StayTag. Anyone who scans can read the item, dates,
          part number and optional buy link. Never include confidential information. My tags stays in this browser.
        </p>
      </section>
    </main>
  );
}
