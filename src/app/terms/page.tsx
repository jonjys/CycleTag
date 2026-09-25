import type { Metadata } from "next";
import { contact, contactLinks, operatorTaxDisclosure, operatorLegalLine } from "@/lib/contact";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" }, openGraph: { url: "/terms" } };

export default function TermsPage() {
  return <main className="legal-page"><article><div className="section-kicker">STAYTAG</div><h1>Terms of use</h1><p className="updated">Last updated 25 September 2026</p>
    <h2>Operator</h2><p>{contact.productName} is a product of <a href={contactLinks.operator}>{contact.operatorName}</a> in {contact.country}. {contact.operatorName} is a {contact.legalForm}. {operatorTaxDisclosure}</p>
    <p>{operatorLegalLine}</p>
    <h2>Service</h2><p>StayTag creates QR care snapshots and calendar files from information you provide. Care history is self-reported and editable, not independently verified or certified. A photo hash identifies file bytes; it does not establish who performed maintenance or when. Keep your original photos. Logging or correcting care creates a new QR; existing stickers remain unchanged. The service is supplied as-is without a guarantee of uninterrupted availability.</p>
    <h2>Free labels and optional support</h2><p>Single labels, the 12-label Care Sheet with its care schedule, and bulk sheets are free. No physical stickers or printer are supplied. Optional one-time support is charged in SEK and buys no label package, service or extra features.</p>
    <h2>Your responsibility</h2><p>You are responsible for confirming product compatibility, replacement intervals, prices, delivery terms and seller reliability before buying. StayTag does not sell, stock or fulfil marketplace products.</p>
    <h2>No professional advice</h2><p>StayTag is a convenience tool, not safety, maintenance, medical or professional advice. Follow the manufacturer’s instructions for critical equipment.</p>
    <h2>Acceptable use</h2><p>Do not use StayTag for unlawful content, deceptive links, personal data, secrets or attempts to interfere with the service.</p>
    <h2>Liability</h2><p>To the maximum extent permitted by law, StayTag is not liable for indirect loss, missed replacements, incompatible purchases or third-party marketplace actions.</p>
    <h2>Billing and payments</h2><p>{contact.vatStatus}. For questions about a StayTag invoice, charge or payment, email <a href={contactLinks.billing}>{contact.email.billing}</a>.</p>
  </article></main>;
}

