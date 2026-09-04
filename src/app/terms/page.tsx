import type { Metadata } from "next";
import { contact, contactLinks } from "@/lib/contact";

export const metadata: Metadata = { title: "Terms", alternates: { canonical: "/terms" }, openGraph: { url: "/terms" } };

export default function TermsPage() {
  return <main className="legal-page"><article><div className="section-kicker">CYCLETAG</div><h1>Terms of use</h1><p className="updated">Last updated 4 September 2026</p>
    <h2>Operator</h2><p>{contact.productName} is a product operated by <a href={contactLinks.operator}>{contact.operatorName}</a> in {contact.country}.</p>
    <h2>Service</h2><p>CycleTag creates QR links and calendar files from information you provide. The service is supplied as-is without a guarantee of uninterrupted availability.</p>
    <h2>Your responsibility</h2><p>You are responsible for confirming product compatibility, replacement intervals, prices, delivery terms and seller reliability before buying. CycleTag does not sell, stock or fulfil marketplace products.</p>
    <h2>No professional advice</h2><p>CycleTag is a convenience tool, not safety, maintenance, medical or professional advice. Follow the manufacturer’s instructions for critical equipment.</p>
    <h2>Acceptable use</h2><p>Do not use CycleTag for unlawful content, deceptive links, personal data, secrets or attempts to interfere with the service.</p>
    <h2>Liability</h2><p>To the maximum extent permitted by law, CycleTag is not liable for indirect loss, missed replacements, incompatible purchases or third-party marketplace actions.</p>
    <h2>Billing and payments</h2><p>For questions about a CycleTag invoice, charge or payment, email <a href={contactLinks.billing}>{contact.email.billing}</a>.</p>
  </article></main>;
}
