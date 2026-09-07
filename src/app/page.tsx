import type { Metadata } from "next";
import { ArrowDown, ArrowRight, Package, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { brandsCopy, heroCopy } from "@/lib/home-copy";
import { bulkPackPaymentUrl, bulkPackPrice } from "@/lib/commerce";
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
          <div className="hero-actions">
            <a className="primary-button" href="#create">{heroCopy.primaryCta} <ArrowDown aria-hidden="true" size={18} /></a>
            <a className="secondary-button" href={sampleUrl}>{heroCopy.secondaryCta}</a>
          </div>
          <div className="hero-points" aria-label="Key benefits">
            {heroCopy.points.map((point) => <span key={point}>{point}</span>)}
          </div>
          <p className="hero-affiliate">
            {heroCopy.affiliateNote}{" "}
            <Link href="/affiliate">Affiliate disclosure</Link>
          </p>
        </div>

        <div className="hero-product">
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

      <TagShelf />

      <ToolDirectory />

      <section className="bulk-offer no-print" id="bulk" aria-labelledby="bulk-offer-title">
        <div className="bulk-offer-copy">
          <div className="section-kicker">PAID BULK PACK</div>
          <h2 id="bulk-offer-title">Print 50 reorder labels at once.</h2>
          <p>For offices, workshops, cleaners, landlords and stock rooms. Paste a list of recurring replacements and turn it into an A4 sheet of QR labels.</p>
          <div className="bulk-price">{bulkPackPrice}<span>one-time</span></div>
          <div className="bulk-actions-row">
            <a className="primary-button" href={bulkPackPaymentUrl}>Get CycleTag Bulk <ArrowRight aria-hidden="true" size={18} /></a>
            <Link className="secondary-button" href="/bulk">Open bulk tool</Link>
          </div>
          <small>One-time setup. No account. No subscription. Payment is handled by Stripe.</small>
        </div>
        <div className="bulk-card" aria-label="Bulk pack contents">
          <strong>Included</strong>
          <ul>
            <li>Up to 50 labels per A4 sheet</li>
            <li>CSV-style paste input</li>
            <li>QRs generated in the browser</li>
            <li>Same CycleTag scan + reorder flow</li>
          </ul>
        </div>
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
