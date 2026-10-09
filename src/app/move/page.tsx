import { applicationSchema, jsonLd, publicPageMetadata } from "@/lib/seo";
import Link from "next/link";
import { MovePlanner } from "./move-planner";
import "./move.css";

export const metadata = publicPageMetadata("/", "QR moving box labels — print, scan & find your things", "Make printable QR moving box labels with contents, room colours and a searchable packing list. Three boxes free. No app or account. Move Pass costs SEK 79.", "/move/opengraph-image");

export default function MovePage() {
  return <main className="mv-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(applicationSchema("/move", "StayTag Move", "Printable QR moving box labels and a local searchable box inventory. Three boxes free; Move Pass costs SEK 79 once.", ["QR box contents", "Colour-coded rooms", "Searchable box inventory", "A4 or Letter labels and packing index"])) }} /><MovePlanner /><p className="mv-fine no-print"><Link href="/guides/qr-moving-box-labels">How to label moving boxes with QR codes →</Link> <Link href="/guides/moving-box-inventory">Moving box inventory →</Link> <Link href="/guides/printable-moving-box-labels">Printable moving labels →</Link></p></main>;
}
