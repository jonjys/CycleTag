import type { Metadata } from "next";
import { contact, contactLinks, operatorTaxDisclosure } from "@/lib/contact";

export const metadata: Metadata = { title: "Affiliate disclosure", alternates: { canonical: "/affiliate" }, openGraph: { url: "/affiliate" } };

export default function AffiliatePage() {
  return <main className="legal-page"><article><div className="section-kicker">TRANSPARENT MONETIZATION</div><h1>Affiliate disclosure</h1><p className="updated">Last updated 4 September 2026</p>
    <p>Some marketplace links can be affiliate links. If you click one and complete a qualifying purchase, CycleTag may receive a commission from the marketplace. You pay the same price.</p>
    <p>Each shopping region currently opens one eBay marketplace rather than every local shop: United States → eBay.com, United Kingdom → eBay.co.uk, Europe / Nordics → eBay.de, France → eBay.fr, Italy → eBay.it, Spain → eBay.es, Australia → eBay.com.au, Canada → eBay.ca.</p>
    <p>An affiliate relationship does not determine the search phrase stored in your tag. CycleTag does not display marketplace prices, reviews or seller claims and does not automatically place orders.</p>
    <p>Affiliate compensation is not guaranteed. Eligibility, attribution windows, category rates, returns and exclusions are controlled by the marketplace’s current programme terms.</p>
    <p>If a qualifying purchase earns a commission, it is received by <a href={contactLinks.operator}>{contact.operatorName}</a>, operated by {contact.operatorPerson} in {contact.country}. {operatorTaxDisclosure}</p>
    <p>For general questions about CycleTag or its affiliate relationships, email <a href={contactLinks.general}>{contact.email.general}</a>.</p>
  </article></main>;
}
