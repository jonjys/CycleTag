import QRCode from "qrcode";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { Landing } from "./landing";
import { applicationSchema, jsonLd, publicPageMetadata, websiteSchema } from "@/lib/seo";
export const metadata = publicPageMetadata("/", "Free QR maintenance labels & replacement reminders", "Create free printable QR maintenance labels. Save exact part numbers, replacement dates and care history on the machine. No account or app needed.");
const sample: TagPayload = {
  v: 1,
  n: "Coffee machine water filter",
  q: "DeLonghi DLSC002 water filter",
  c: "coffee",
  i: 60,
  s: "2026-09-01",
  m: "DE",
  care: { part: "DLSC002", marketplace: true, history: [{ n: "Coffee machine water filter", part: "DLSC002", s: "2026-07-03", i: 60 }] }
};

export default async function Home() {
  const sampleUrl = buildTagUrl(siteUrl, sample);
  const qr = await QRCode.toDataURL(sampleUrl, { errorCorrectionLevel: "M", width: 560, margin: 4 });
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(applicationSchema("/", "StayTag maintenance labels", "Free printable QR labels for parts, maintenance dates and care history.", ["Free maintenance labels", "Replacement reminders", "Local care history", "PNG and A4 printing"])) }} /><Landing sampleUrl={sampleUrl} qr={qr} /></>;
}
