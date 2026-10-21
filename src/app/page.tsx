import { applicationSchema, jsonLd, publicPageMetadata, websiteSchema } from "@/lib/seo";
import { HashForward } from "./hash-forward";
import { MoveLanding } from "./move-landing";
import "./move-landing.css";

export const metadata = publicPageMetadata("/", "Every box. Home. — QR labels & shared moving-day checks", "Print QR moving box labels. Share one link with your helpers. Check what's loaded, what's arrived and which box numbers are missing. 3 boxes free. No app or account.", "/move/opengraph-image");

const app = applicationSchema("/", "StayTag Move", "QR moving box labels and optional shared moving-day checks. Three boxes free; Move Pass costs SEK 79 once.", ["Printable QR moving box labels", "Shared loaded and delivered checks", "Missing box numbers", "Printable moving-day status report"]);

export default function Home() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([websiteSchema, app]) }} />
    <HashForward />
    <MoveLanding />
  </>;
}
