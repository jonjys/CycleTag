import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy", alternates: { canonical: "/privacy" }, openGraph: { url: "/privacy" } };

export default function PrivacyPage() {
  return <Legal title="Privacy policy" updated="27 August 2026">
    <h2>What CycleTag stores</h2><p>CycleTag does not provide accounts and does not store the content of tags in a database. A tag’s item name, search phrase, interval, start date and market are encoded after the # in its URL and QR code. Browsers do not send that fragment to the web server.</p>
    <h2>Hosting logs</h2><p>The hosting provider may process ordinary request metadata such as IP address, user agent, requested path and timestamp for security and service operation. Newly generated tag data is kept in the URL fragment rather than the requested path. CycleTag does not add analytics, advertising pixels or tracking cookies.</p>
    <h2>Marketplace links</h2><p>When you choose a marketplace link, that marketplace applies its own privacy policy. Links may contain an affiliate campaign identifier and a non-personal category label.</p>
    <h2>Your control</h2><p>Anyone with a tag link can read the information encoded in it. Do not put personal, confidential or sensitive information in a tag. Destroy the printed tag and delete its link to remove your copy.</p>
  </Legal>;
}

function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <main className="legal-page"><article><div className="section-kicker">CYCLETAG</div><h1>{title}</h1><p className="updated">Last updated {updated}</p>{children}</article></main>;
}
