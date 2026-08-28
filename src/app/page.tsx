import { ShieldCheck } from "lucide-react";
import { Generator } from "./generator";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">THE REORDER LABEL THAT NEVER FORGETS</div>
        <h1>Scan.<br />Reorder.<br /><em>Repeat.</em></h1>
        <p className="hero-copy">
          Put a stateless QR label on anything you replace. One scan brings back the exact search and the next replacement date — without an app or account.
        </p>
        <div className="hero-points" aria-label="Key benefits">
          <span>Free to create</span><span>No app required</span><span>Data stays in the QR</span>
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
