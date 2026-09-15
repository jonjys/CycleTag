import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Package, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { brandsCopy, heroCopy } from "@/lib/home-copy";
import { starterSheetPaymentUrl, starterSheetPrice, starterSheetPriceSek } from "@/lib/commerce";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { HomeGenerator } from "./home-generator";
import { TagShelf } from "./tag-shelf";
import { ToolDirectory } from "./tool-directory";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: "CycleTag — Scan. Reorder. Repeat.",
    description: "A permanent QR label for every thing you replace."
  }
};

const sampleTag: TagPayload = {
  v: 1,
  n: "Coffee machine filter",
  q: "DeLonghi DLSC002 water filter",
  c: "coffee",
  i: 60,
  s: "2026-08-28",
  m: "DE"
};

export default async function Home() {
  const sampleUrl = buildTagUrl(siteUrl, sampleTag);
  const sampleQr = await QRCode.toDataURL(sampleUrl, {
    errorCorrectionLevel: "M",
    width: 560,
    margin: 2,
    color: { dark: "#171713", light: "#fffef9" }
  });

  return (
    <main>
      <section className="hero">
        <div className="hero-message">
          <div className="eyebrow">{heroCopy.eyebrow}</div>
          <h1>{heroCopy.titleLead}<br />{heroCopy.titleMid}<br /><em>{heroCopy.titleAccent}</em></h1>
          <p className="hero-copy">{heroCopy.body}</p>
          <div className="hero-price">
            <strong>{starterSheetPrice}</strong>
            <span>{starterSheetPriceSek} at checkout · starter sheet</span>
          </div>
          <div className="hero-actions">
            <a className="primary-button" href={starterSheetPaymentUrl}>Buy starter sheet <ArrowRight aria-hidden="true" size={18} /></a>
            <a className="secondary-button" href="#create">{heroCopy.primaryCta} <ArrowDown aria-hidden="true" size={18} /></a>
          </div>
          <div className="hero-points" aria-label="Key benefits">
            <span>{starterSheetPrice} sheet</span>
            <span>Free bulk tool</span>
            <span>No app or account</span>
            <span>Any printer · A4</span>
          </div>
          <p className="hero-affiliate">
            {heroCopy.affiliateNote}{" "}
            <Link href="/affiliate">Affiliate disclosure</Link>
          </p>
        </div>

        <div className="hero-product">
          <div className="hero-shot">
            <Image
              src="/images/product.jpg"
              alt="A CycleTag QR label stuck on toner next to an air filter"
              width={1200}
              height={900}
              priority
            />
          </div>
          <div className="hero-product-note"><span>Live product demo</span><span>Scan with your phone</span></div>
          <a className="hero-tag" href={sampleUrl} aria-label="Open the Coffee machine filter sample CycleTag">
            <div className="hero-tag-top"><span>CYCLETAG / 01</span><span>EBAY.DE</span></div>
            <div className="hero-tag-body">
              <div className="hero-tag-copy">
                <span>SCAN TO REORDER</span>
                <strong>Coffee<br />machine<br />filter</strong>
                <small>DeLonghi DLSC002</small>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sampleQr} alt="Scannable QR code for the Coffee machine filter sample" width={560} height={560} />
            </div>
            <div className="hero-tag-footer"><span>Replace every 60 days</span><span>Scan → exact search</span></div>
          </a>
          <div className="scan-story" aria-label="How the sample tag is used">
            <span>1. Print</span><span>2. Stick</span><span>3. Scan</span><span>4. Reorder</span>
          </div>
          <p className="hero-product-caption">A real tag, not decoration. Scan it to open the sample reorder page.</p>
        </div>
      </section>

      <HomeGenerator />

      <section className="bulk-offer no-print" aria-labelledby="seller-kits-title"><div className="bulk-offer-copy"><div className="section-kicker">NEW / FOR SELLERS & BRANDS</div><h2 id="seller-kits-title">Your package.<br />Your next sale.</h2><p>Turn the package you already send into a reorder card. Your product, exact SKU and your own regional store links — not a competing marketplace search.</p><Link href="/sellers" className="primary-button">Create a Seller Kit <ArrowRight size={18} aria-hidden="true" /></Link></div><div className="bulk-card"><strong>Give buyers a way back.</strong><ul><li>One QR, up to three regional store links</li><li>English, Swedish and Chinese customer pages</li><li>Printable A4 cards and vector QR download</li><li>No account, no affiliate ID replacement</li></ul><p>Free DIY. Check your sales channel’s packaging rules before use. No marketplace affiliation implied.</p></div></section>
      <section className="bulk-offer no-print" aria-labelledby="relay-title">
        <div className="bulk-offer-copy"><div className="section-kicker">NEW / FREE REFILL RELAY</div><h2 id="relay-title">You scan.<br />They restock.</h2><p>Collect refills from different labels into one list. Send exact searches and quantities to your partner, office manager or whoever does the buying.</p><Link className="primary-button" href="/relay">Start a refill list <ArrowRight aria-hidden="true" size={18} /></Link></div>
        <div className="bulk-card"><strong>Turn “we need more” into a handoff.</strong><ul><li>Works with existing CycleTag labels and Spaces</li><li>One list, up to 24 items, adjustable quantities</li><li>Share a link or print a shopping checklist</li><li>Recipients open it without an account</li></ul><p>Shared snapshots, not live inventory. No automatic purchases.</p><Link href="/relay#demo=1">Try an example handoff →</Link></div>
      </section>


      <section className="bulk-offer no-print" aria-labelledby="spaces-title">
        <div className="bulk-offer-copy">
          <div className="section-kicker">NEW / FREE CYCLETAG SPACES</div>
          <h2 id="spaces-title">One QR.<br />Every refill.</h2>
          <p>Your kitchen, office or workshop — up to six replacements behind one QR. Share the refill list with anyone. No app, no account, no database.</p>
          <Link className="primary-button" href="/spaces">Create a Space <ArrowRight aria-hidden="true" size={18} /></Link>
        </div>
        <div className="bulk-card" aria-label="CycleTag Spaces features">
          <strong>One label for the whole corner.</strong>
          <ul><li>Combine existing tags or add your own items</li><li>Scan once, choose the item, reopen its search</li><li>Share a link with your household or team</li><li>Print on ordinary A4 paper</li></ul>
          <p>Shared snapshots, not live inventory. Changes need a new QR.</p>
        </div>
      </section>

      <section className="starter-offer no-print" id="starter" aria-labelledby="starter-offer-title">
        <div id="sheet" />
        <div className="starter-offer-copy">
          <div className="section-kicker">FASTEST PAID START</div>
          <h2 id="starter-offer-title">Send the items.<br />Get the sheet.</h2>
          <p>For teams that do not want to build labels one by one. Send 5–10 recurring supplies and get a ready-to-print QR reorder sheet back.</p>
        </div>
        <div className="starter-panel">
          <div className="starter-price">{starterSheetPrice}<span>{starterSheetPriceSek} · starter sheet</span></div>
          <ol>
            <li>Pay the starter price.</li>
            <li>Email the items you reorder.</li>
            <li>Receive a printable CycleTag sheet.</li>
          </ol>
          <div className="starter-actions">
            <a className="primary-button" href={starterSheetPaymentUrl}>Buy starter sheet <ArrowRight aria-hidden="true" size={18} /></a>
            <a className="secondary-button" href="mailto:hello@nyttolabs.com?subject=CycleTag%20starter%20sheet&body=Hi%20Nytto%20Labs%2C%0A%0AI%20want%20a%20CycleTag%20starter%20sheet.%20Here%20are%20the%20items%20we%20reorder%3A%0A%0A1.%20%0A2.%20%0A3.%20%0A4.%20%0A5.%20%0A%0AWebsite%20or%20supplier%20we%20normally%20use%3A%0A%0A">Send item list</a>
          </div>
          <small>Best for toner, filters, coffee supplies, cleaning stock, workshop parts and appliance refills.</small>
        </div>
      </section>

      <section className="bulk-offer no-print" id="bulk" aria-labelledby="bulk-offer-title">
        <div className="bulk-offer-copy">
          <div className="section-kicker">FREE BULK TOOL</div>
          <h2 id="bulk-offer-title">One list.<br />Up to 50 reorder labels.</h2>
          <p>Label an office, workshop or stock room in one batch. Paste the toner, filters and parts you replace, then print QR labels on ordinary A4 paper.</p>
          <div className="bulk-actions-row">
            <Link className="primary-button" href="/bulk">Open bulk tool <ArrowRight aria-hidden="true" size={18} /></Link>
          </div>
          <small>Free to use. No account, no subscription — QR labels are generated in your browser. Want it done for you instead? Use the starter sheet above.</small>
        </div>
        <div className="bulk-card" aria-label="Bulk pack contents">
          <strong>Included</strong>
          <ul>
            <li>Up to 50 labels per batch, across A4 pages</li>
            <li>CSV-style paste input</li>
            <li>QRs generated in the browser</li>
            <li>Same CycleTag scan + reorder flow</li>
          </ul>
        </div>
      </section>

      <ToolDirectory />

      <TagShelf />

      <section className="purchase-faq no-print" aria-labelledby="purchase-faq-title">
        <div className="section-kicker">BEFORE YOU PRINT</div>
        <h2 id="purchase-faq-title">A few practical answers.</h2>
        <details><summary>Do I need a label printer?</summary><p>No. Print on ordinary A4 paper, cut out the labels and attach them. Full-sheet adhesive paper is optional and must suit your printer. Pre-cut label sheets need a matching template; CycleTag does not promise alignment with every brand.</p></details>
        <details><summary>Does the QR buy the item automatically?</summary><p>No. It opens your saved item and an eBay search. You check the model, seller, price and delivery before buying on eBay. CycleTag does not guarantee stock or compatibility.</p></details>
        <details><summary>What is free?</summary><p>Both the single-label generator and the Bulk tool (up to 50 labels) are free to use in your browser. The only paid option is the starter sheet — a done-for-you service where you send your items and we send back a ready-to-print sheet. Labels, printers and replacement products are not included.</p></details>
        <details><summary>Can I change a printed label?</summary><p>The QR stores the original item details. To change a part number, create and print a corrected label. The destination search can show new eBay listings without changing the QR.</p></details>
      </section>

      <section className="how-it-works no-print" id="how">
        <div className="loop-heading">
          <div>
            <div className="section-kicker">ONE SETUP. REPEATED USE.</div>
            <h2>Make it once.<br />Scan it forever.</h2>
          </div>
          <p>The label stays with the object, so the exact replacement is always one scan away.</p>
        </div>
        <figure className="loop-visual">
          <Image
            src="/images/cycletag-loop-v2.webp"
            alt="A CycleTag label is printed, attached to a coffee machine, scanned with a phone and used to reorder a replacement filter"
            width={1672}
            height={620}
            sizes="(max-width: 650px) 100vw, 84vw"
          />
          <figcaption>From empty shelf to replacement — without remembering a model number.</figcaption>
        </figure>
        <div className="steps" aria-label="How CycleTag works">
          <article><b>01</b><h3>Create</h3><p>Add the exact item once.</p></article>
          <article><b>02</b><h3>Stick</h3><p>Put the label where it lives.</p></article>
          <article><b>03</b><h3>Scan</h3><p>Use any phone camera.</p></article>
          <article><b>04</b><h3>Reorder</h3><p>Open the live eBay search for that region.</p></article>
        </div>
      </section>

      <section className="brands-band no-print" id="brands" aria-labelledby="brands-title">
        <div className="brands-copy">
          <div className="section-kicker">{brandsCopy.kicker}</div>
          <h2 id="brands-title">{brandsCopy.title}</h2>
          <p>{brandsCopy.body}</p>
          <p className="brands-honesty">{brandsCopy.honesty}</p>
          <a className="primary-button" href="#create">{brandsCopy.cta} <ArrowRight aria-hidden="true" size={18} /></a>
        </div>
        <ul className="brands-points">
          {brandsCopy.points.map((point, index) => (
            <li key={point.title}>
              <Package aria-hidden="true" size={18} />
              <div>
                <strong><span>0{index + 1}</span> {point.title}</strong>
                <p>{point.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="privacy-strip no-print">
        <div><ShieldCheck className="privacy-icon" aria-hidden="true" size={22} /><strong>Zero-database design</strong></div>
        <p>The item name, search phrase, date and market are encoded inside your QR and share link. Anyone with that QR or link can read them. CycleTag has no account to breach and no list of your supplies to sell.</p>
      </section>
    </main>
  );
}
