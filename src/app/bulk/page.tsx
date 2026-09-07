import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { BulkGenerator } from "./bulk-generator";

export const metadata: Metadata = {
  title: "CycleTag Bulk Pack — print 50 reorder labels at once",
  description: "Paste recurring replacement items and generate a printable A4 sheet of QR reorder labels. No account. No subscription.",
  alternates: { canonical: "/bulk" },
  openGraph: {
    type: "website",
    url: "/bulk",
    title: "CycleTag Bulk Pack",
    description: "Print 50 reorder labels at once."
  }
};

export default function BulkPage() {
  return (
    <main className="tool-page bulk-page">
      <section className="tool-hero bulk-hero">
        <Link className="tool-back" href="/"><ArrowLeft aria-hidden="true" size={16} /> Back to CycleTag</Link>
        <div className="section-kicker">CYCLETAG BULK PACK</div>
        <h1>Print 50 reorder labels at once.</h1>
        <p>For offices, workshops, cleaners, landlords and stock rooms. Paste a recurring replacement list and turn it into a printable A4 QR-label sheet.</p>
        <div className="tool-facts" aria-label="Bulk facts">
          <span><CheckCircle2 aria-hidden="true" size={14} /> One-time purchase</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> No account</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> No subscription</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> Browser generated</span>
        </div>
      </section>

      <BulkGenerator />
    </main>
  );
}
