import type { Metadata } from "next";
import QRCode from "qrcode";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, type TagPayload } from "@/lib/tag";
import { Landing } from "./landing";
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title: "StayTag · Nytto Labs", description: "Part numbers. Care dates. Free QR labels that stay with your machine." }
};
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
  return <Landing sampleUrl={sampleUrl} qr={qr} />;
}
