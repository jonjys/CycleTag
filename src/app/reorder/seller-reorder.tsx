"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ExternalLink } from "lucide-react";
import { decodeSellerKit, kitCopy } from "@/lib/seller-kit";
const snapshot = () => window.location.hash;
const serverSnapshot = () => null;
function subscribe(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }
export function SellerReorder() {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  if (hash === null) return <p role="status">Opening reorder card…</p>;
  const kit = decodeSellerKit(new URLSearchParams(hash.slice(1)).get("kit"));
  if (!kit) return <section className="seller-heading"><h1>This card cannot be read.</h1><p>Ask the sender for the complete link. No external destination has been opened.</p><Link href="/sellers">Create a Seller Kit →</Link></section>;
  const copy = kitCopy[kit.language];
  return <article className="seller-customer" lang={kit.language}><div className="section-kicker">STAYTAG / SELLER KIT</div><p className="seller-brand">{kit.seller}</p><h1>{kit.product}</h1><p className="seller-sku">{copy.sku}: <strong>{kit.sku}</strong></p><h2>{copy.choose}</h2><p className="seller-warning">{copy.note}</p><div className="seller-stores">{kit.links.map((link, i) => <section key={i}><h3>{link.region}</h3><strong className="seller-destination">{new URL(link.url).hostname}</strong><a className="primary-button" href={link.url} data-store-link="true" target="_blank" rel="nofollow sponsored noopener noreferrer">{copy.open}<ExternalLink size={18} aria-hidden="true" /></a><details><summary>URL</summary><p className="seller-full-url">{link.url}</p></details></section>)}</div><p>{copy.privacy}</p><Link className="secondary-button" href="/sellers">{copy.create} →</Link></article>;
}

