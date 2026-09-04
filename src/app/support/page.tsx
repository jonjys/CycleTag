import type { Metadata } from "next";
import { contact, contactLinks } from "@/lib/contact";

export const metadata: Metadata = { title: "Support", alternates: { canonical: "/support" }, openGraph: { url: "/support" } };

export default function SupportPage() {
  return <main className="legal-page"><article><div className="section-kicker">CYCLETAG HELP</div><h1>Support</h1>
    <p>Choose the address that matches your question so it reaches the right place.</p>
    <h2>Product support</h2><p>For help using CycleTag, printing a label or reporting a product issue, email <a href={contactLinks.support}>{contact.email.support}</a>.</p>
    <h2>Correct a tag</h2>
    <p>If the part number is wrong, scan the label and choose <strong>Correct this tag</strong>. CycleTag copies the details into the builder in your browser so you can fix them and print a new QR. That is a replacement label, not an update: the old sticker still encodes the previous search, because there is no account or database that could change a QR after it is printed. Cover or discard the old label once the new one is stuck on.</p>
    <h2>Shopping region</h2>
    <p>Each CycleTag region currently opens one eBay marketplace. Europe / Nordics, for example, opens eBay.de. The create form and scan page show that destination before you print, copy or click through.</p>
    <h2>Privacy and GDPR</h2><p>For privacy questions, data requests or deletion requests, email <a href={contactLinks.privacy}>{contact.email.privacy}</a>.</p>
    <h2>Billing and payments</h2><p>For invoice, charge or payment questions, email <a href={contactLinks.billing}>{contact.email.billing}</a>.</p>
    <h2>General enquiries</h2><p>For partnerships, media and company enquiries, email <a href={contactLinks.general}>{contact.email.general}</a>.</p>
    <p>CycleTag is a product by <a href={contactLinks.operator}>{contact.operatorName}</a>, {contact.country}.</p>
  </article></main>;
}
