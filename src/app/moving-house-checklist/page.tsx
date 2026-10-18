import Link from "next/link";
import { MoveChecklist } from "../move/move-checklist";
import { applicationSchema, jsonLd, publicPageMetadata } from "@/lib/seo";
import "../move/move.css";

export const metadata = publicPageMetadata(
  "/moving-house-checklist",
  "Free moving house checklist — plan, pack & settle in",
  "Plan your move with a free interactive moving house checklist. Set a moving date, tick off 16 tasks and add your own. No account. Available in English and Swedish.",
  "/move/opengraph-image"
);

export default function MovingChecklistPage() {
  return <main className="mv-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({
      ...applicationSchema("/moving-house-checklist", "StayTag Moving House Checklist", "Free moving checklist with a date, four planning phases, progress and custom tasks.", ["16 moving tasks", "Suggested planning dates", "Custom tasks", "English and Swedish", "Saved in this browser"]),
      offers: { "@type": "Offer", price: "0", priceCurrency: "SEK" }
    }) }} />
    <header className="mv-hero"><div className="section-kicker">STAYTAG MOVE</div><h1>Free moving house checklist</h1><p>From booking the van to finding the kettle: keep the next step in one place. No account, no subscription. Choose SV in the language menu for a Swedish checklist.</p><p className="mv-fine" lang="sv">Gratis checklista för flytten: planera, packa och kom i ordning. Välj SV i språkmenyn för svenska.</p></header>
    <MoveChecklist />
    <section className="mv-how" aria-labelledby="checklist-next"><h2 id="checklist-next">Packing next? Put the contents on the box.</h2><p>Create QR labels by room, list what is inside and scan a box with any phone camera. Try three boxes free; Move Pass unlocks unlimited boxes for SEK 79 once.</p><p><Link className="primary-button" href="/#start">Create your first box label →</Link></p><p className="mv-fine"><Link href="/guides/moving-box-inventory">Moving box inventory guide</Link> · <Link href="/guides/qr-moving-box-labels">How QR moving box labels work</Link></p></section>
  </main>;
}
