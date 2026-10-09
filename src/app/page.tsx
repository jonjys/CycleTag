import { applicationSchema, jsonLd, publicPageMetadata, websiteSchema } from "@/lib/seo";
import { moveFaq } from "@/lib/move-faq";
import { MovePlanner } from "./move/move-planner";
import { MoveSeo } from "./move/move-seo";
import { HashForward } from "./hash-forward";
import "./move/move.css";

export const metadata = publicPageMetadata("/", "QR moving box labels – print, scan & find anything", "Printable QR labels for moving boxes: list the contents, colour-code rooms and scan any box to see what's inside. Search your phone for any item. 3 boxes free, no app or account.", "/move/opengraph-image");

const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: moveFaq.map(f => ({ "@type": "Question", name: f.q[0], acceptedAnswer: { "@type": "Answer", text: f.a[0] } })) };
const app = applicationSchema("/", "StayTag Move", "Printable QR moving box labels and a searchable box inventory. Three boxes free; Move Pass costs SEK 79 once.", ["QR box contents readable by any phone", "Colour-coded rooms", "Searchable box inventory", "A4 or Letter labels and packing index"]);

export default function Home() {
  return <main className="mv-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([websiteSchema, app, faqSchema]) }} />
    <HashForward />
    <MovePlanner />
    <MoveSeo />
  </main>;
}
