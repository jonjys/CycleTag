import type { Metadata } from "next";
import { contact, contactLinks, operatorTaxDisclosure } from "@/lib/contact";

export const metadata: Metadata = { title: "Support", alternates: { canonical: "/support" }, openGraph: { url: "/support" } };

export default function SupportPage() {
  return <main className="legal-page"><article><div className="section-kicker">STAYTAG HELP</div><h1>Support</h1>
    <p>Choose the address that matches your question so it reaches the right place.</p>
    <h2>Product support</h2><p>For help using StayTag, printing a label or reporting a product issue, email <a href={contactLinks.support}>{contact.email.support}</a>.</p>
    <h2>Move Pass and recovery</h2><p>Move Pass costs SEK 79 once and unlocks boxes after Stripe confirms payment. Do not pay again if confirmation is delayed: reload the move page or contact <a href={contactLinks.billing}>{contact.email.billing}</a> with your receipt.</p><p>After activation, use “Save my recovery link” to keep a private copy. If you no longer have the link, email billing@nyttolabs.com with your receipt. To use it in another browser, open the saved link, or paste it under “Already paid?” in the box planner. Restoring a pass does not transfer your box list or checklist: those remain in the original browser.</p><p>To request withdrawal within 14 days or report a faulty purchase, email <a href={contactLinks.billing}>{contact.email.billing}</a> with your receipt. See the <a href="/terms">terms</a>.</p>
    <h2>Correct a tag</h2>
    <p>If the part number is wrong, scan the label and choose <strong>Correct this tag</strong>. StayTag copies the details into the builder in your browser so you can fix them and print a new QR. That is a replacement label, not an update: the old sticker still encodes the previous search, because there is no account or database that could change a QR after it is printed. Cover or discard the old label once the new one is stuck on.</p>
    <h2>Shopping region</h2>
    <p>Each StayTag region currently opens one eBay marketplace. Europe / Nordics, for example, opens eBay.de. The create form and scan page show that destination before you print, copy or click through.</p>
    <h2>Privacy and GDPR</h2><p>For privacy questions, data requests or deletion requests, email <a href={contactLinks.privacy}>{contact.email.privacy}</a>.</p>
    <h2>Billing and payments</h2><p>For invoice, charge or payment questions, email <a href={contactLinks.billing}>{contact.email.billing}</a>.</p>
    <h2>General enquiries</h2><p>For partnerships, media and company enquiries, email <a href={contactLinks.general}>{contact.email.general}</a>.</p>
    <p>StayTag is a product of <a href={contactLinks.operator}>{contact.operatorName}</a>, {contact.country}. {operatorTaxDisclosure}</p>
  </article></main>;
}

