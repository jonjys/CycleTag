import { applicationSchema, jsonLd, publicPageMetadata, websiteSchema } from "@/lib/seo";
import { HashForward } from "./hash-forward";
import { MoveLanding } from "./move-landing";
import "./move-landing.css";

export const metadata = publicPageMetadata("/", "QR moving box labels — AI lists what's inside | StayTag", "Snap a photo of an open moving box and AI lists the contents. Print QR labels, search for any item later, and share moving-day checks with helpers. 3 boxes free. No app or account.", "/move/opengraph-image");

const app = applicationSchema("/", "StayTag Move", "QR moving box labels and optional shared moving-day checks. Three boxes free; Move Pass costs SEK 79 once.", ["Printable QR moving box labels", "AI box contents from one photo", "Shared loaded and delivered checks", "Missing box numbers", "Printable moving-day status report"]);

export default function Home() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([websiteSchema, app]) }} />
    <HashForward />
    <MoveLanding />
  </>;
}
