import { publicPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BulkGenerator } from "./bulk-generator";

export const metadata = publicPageMetadata("/bulk", 'Free bulk QR labels — print up to 50 on A4', 'Paste recurring replacement items and generate free printable A4 QR labels for offices, workshops and stock rooms. Up to 50 items. No account or subscription.');

export default function BulkPage() {
  return (
    <main className="tool-page bulk-page">
      <section className="tool-hero bulk-hero">
        <Link className="tool-back" href="/labels"><ArrowLeft aria-hidden="true" size={16} /> Back to StayTag</Link>
        <div className="section-kicker">STAYTAG BULK PACK</div>
        <h1>Print 50 reorder labels at once.</h1>
        <p>For offices, workshops, cleaners, landlords and stock rooms. Paste up to 50 recurring replacements and print them across A4 pages. Use ordinary paper, cut out the labels and attach them.</p>
        <div className="tool-facts" aria-label="Bulk facts">
          <span><CheckCircle2 aria-hidden="true" size={14} /> Free to use</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> No account</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> No subscription</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> Browser generated</span>
        </div>
      </section>

      <BulkGenerator />
    </main>
  );
}

