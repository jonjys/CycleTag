import { ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { Generator } from "./generator";

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
  const sampleUrl = buildTagUrl("https://cycletag.vercel.app", sampleTag);
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

      <Generator />

      <section className="how-it-works no-print" id="how">
        <div className="section-kicker">ONE SETUP. REPEATED USE.</div>
        <h2>A tiny physical loop.</h2>
        <div className="steps">
          <article><b>01</b><h3>Create</h3><p>Name the item, add its search phrase and replacement interval.</p></article>
          <article><b>02</b><h3>Stick</h3><p>Print the QR label and place it where the consumable lives.</p></article>
          <article><b>03</b><h3>Scan</h3><p>When it runs out, scan once and reorder from the live marketplace.</p></article>
        </div>
      </section>

      <section className="privacy-strip no-print">
        <div><ShieldCheck className="privacy-icon" aria-hidden="true" size={22} /><strong>Zero-database design</strong></div>
        <p>The item name, search phrase and interval are encoded inside your QR. CycleTag has no account to breach and no list of your supplies to sell.</p>
      </section>
    </main>
  );
}
