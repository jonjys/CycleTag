import type { Metadata } from "next";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { reorderToolPath, reorderTools } from "@/lib/reorder-tools";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { HomeGenerator } from "./home-generator";

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
          <div className="eyebrow">THE REORDER LABEL THAT NEVER FORGETS</div>
          <h1>Scan.<br />Reorder.<br /><em>Repeat.</em></h1>
          <p className="hero-copy">
            Put a stateless QR label on anything you replace. One scan brings back the exact search and the next replacement date — without an app or account.
          </p>
          <div className="hero-points" aria-label="Key benefits">
            <span>Free to create</span><span>No app required</span><span>Data stays in the QR</span>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-product-note"><span>LIVE PRODUCT DEMO</span><span>SCAN WITH YOUR PHONE</span></div>
          <a className="hero-tag" href={sampleUrl} aria-label="Open the Coffee machine filter sample CycleTag">
            <div className="hero-tag-top"><span>CYCLETAG / 01</span><span>DE MARKET</span></div>
            <div className="hero-tag-body">
              <div className="hero-tag-copy">
                <span>SCAN TO REORDER</span>
                <strong>Coffee<br />machine<br />filter</strong>
                <small>DeLonghi DLSC002</small>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sampleQr} alt="Scannable QR code for the Coffee machine filter sample" width={560} height={560} />
            </div>
            <div className="hero-tag-footer"><span>Replace every 60 days</span><span>No account needed</span></div>
          </a>
          <p className="hero-product-caption">A real tag, not decoration. Scan it to open the sample reorder page.</p>
        </div>
      </section>

      <HomeGenerator />

      <section className="tool-directory no-print" aria-labelledby="tool-directory-title">
        <div className="directory-heading">
          <div>
            <div className="section-kicker">START WITH THE RIGHT REPLACEMENT</div>
            <h2 id="tool-directory-title">Free QR reorder label makers.</h2>
          </div>
          <p>Each tool opens with a useful starting interval. Add your exact model or part number before printing.</p>
        </div>
        <div className="tool-link-grid">
          {reorderTools.map((tool, index) => (
            <Link href={reorderToolPath(tool)} key={tool.slug}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <strong>{tool.preset.name}</strong>
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          ))}
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
          <article><b>04</b><h3>Reorder</h3><p>Open the live marketplace search.</p></article>
        </div>
      </section>

      <section className="privacy-strip no-print">
        <div><ShieldCheck className="privacy-icon" aria-hidden="true" size={22} /><strong>Zero-database design</strong></div>
        <p>The item name, search phrase and interval are encoded inside your QR. CycleTag has no account to breach and no list of your supplies to sell.</p>
      </section>
    </main>
  );
}
