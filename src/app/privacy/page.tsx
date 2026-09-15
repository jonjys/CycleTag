import type { Metadata } from "next";
import { contact, contactLinks, operatorTaxDisclosure } from "@/lib/contact";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" }, openGraph: { url: "/privacy" } };

export default function PrivacyPage() {
  return <Legal title="Privacy policy" updated="15 September 2026">
    <h2>Operator</h2>
    <p>{contact.productName} is a product of <a href={contactLinks.operator}>{contact.operatorName}</a>, operated by {contact.operatorPerson} in {contact.country}. {contact.operatorName} is a {contact.legalForm}. {operatorTaxDisclosure}</p>
    <h2>What CycleTag stores</h2><p>CycleTag does not provide accounts and does not store the content of tags in a database. A tag’s item name, search phrase, interval, start date and market are encoded after the # in its URL and QR code. Browsers do not send that fragment to the web server.</p>
    <h2>On-device list</h2><p>If your browser allows it, CycleTag can keep a short list of tags you create so you can reopen or print them later. That list stays in the browser and is not uploaded. Private mode, blocked site data or a full storage quota can prevent saving; the QR and share link still work. Clearing the list, clearing site data or switching browsers removes the local copy. Printed labels are unchanged.</p>
    <h2>Hosting logs</h2><p>The hosting provider may process ordinary request metadata such as IP address, user agent, requested path and timestamp for security and service operation. Newly generated tag data is kept in the URL fragment rather than the requested path. CycleTag does not add analytics, advertising pixels or tracking cookies.</p>
    <h2>Refill Relay</h2><p>Your refill list contains item names, search phrases, marketplaces and quantities. It is saved only in this browser when storage is available; if saving fails, the interface warns you to keep a share link before leaving. Shared lists encode those fields after the # in a link, without a CycleTag database. Anyone receiving or forwarding that link can read them. Sharing through another app is your choice and that app processes the information under its own policy. Received lists are snapshots and do not overwrite your saved list. “Got it” checkmarks stay in the current tab and reset on reload; no purchase or delivery confirmation is sent. Remove local items in Refill Relay or clear this site’s browser data. Deleting your copy does not revoke copies already shared.</p>
    <h2>Marketplace links</h2><p>When you choose a marketplace link, that marketplace applies its own privacy policy. CycleTag currently routes each shopping region to one eBay marketplace (for example Europe / Nordics opens eBay.de). Links may contain an affiliate campaign identifier and a non-personal category label.</p>
    <h2>Your control</h2><p>Anyone with a tag link can read the information encoded in it. The create flow previews the item name, search, date, market and share link before the QR is generated. Do not put personal, confidential or sensitive information in a tag. Destroy the printed tag and delete its link to remove your copy. The optional My tags list can be removed one item at a time or cleared on this device; CycleTag has no server copy of it. Correcting a typo creates a new QR; previously printed labels continue to open the original details because CycleTag cannot rewrite a sticker.</p>
    <h2>Privacy and GDPR requests</h2><p>For privacy questions, access requests or deletion requests, email <a href={contactLinks.privacy}>{contact.email.privacy}</a>.</p>
    <h2>Seller Kits</h2><p>Seller Kits encode the creator-supplied seller name, product, SKU, language and store URLs in the QR link fragment. They are public to anyone with the link and are not verified seller profiles. CycleTag does not fetch or track these destinations. Clicking a store link opens that store under its own privacy policy; URLs may contain creator-supplied affiliate or campaign parameters. CycleTag does not add or replace affiliate IDs in Seller Kit links. Cards are fixed snapshots and cannot be revoked centrally. The pilot enquiry button opens your email app; it sends nothing until you choose to send.</p>
  </Legal>;
}

function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <main className="legal-page"><article><div className="section-kicker">CYCLETAG</div><h1>{title}</h1><p className="updated">Last updated {updated}</p>{children}</article></main>;
}
