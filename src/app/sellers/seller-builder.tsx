"use client";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Download, Plus, Printer, ArrowRight } from "lucide-react";
import { contact } from "@/lib/contact";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { buildSellerKitUrl, kitCopy, validateSellerKit, type KitLanguage, type SellerKit } from "@/lib/seller-kit";
import { siteUrl } from "@/lib/site";

const blank: SellerKit = { v: 1, seller: "", product: "", sku: "", language: "en", links: [{ region: "Worldwide", url: "" }] };
export function SellerBuilder() {
  const [kit, setKit] = useState(blank);
  const [result, setResult] = useState<{ kit: SellerKit; url: string; qr: string; svg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);
  function update(next: SellerKit) { setKit(next); setResult(null); setApproved(false); setMessage(""); }
  async function generate(event: FormEvent) {
    event.preventDefault(); if (!approved) return; setBusy(true); setResult(null); setMessage("");
    try {
      const valid = validateSellerKit(kit);
      if (!valid) throw new Error("Use complete HTTPS product URLs. No passwords, URL fragments, local addresses or custom ports. All fields are required.");
      const url = buildSellerKitUrl(siteUrl, valid);
      const QRCode = (await import("qrcode")).default;
      const options = { errorCorrectionLevel: "M" as const, margin: 4, width: 1200, color: { dark: "#171713", light: "#ffffff" } };
      const [qr, svg] = await Promise.all([QRCode.toDataURL(url, options), QRCode.toString(url, { ...options, type: "svg" })]);
      setResult({ kit: valid, url, qr, svg }); setMessage("Card ready. Open the customer preview and test-scan a printed sample before using it in packaging.");
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not create the card."); }
    finally { setBusy(false); }
  }
  const pilotUrl = `mailto:${contact.email.general}?subject=${encodeURIComponent("StayTag Seller Kit pilot")}&body=${encodeURIComponent(`Hello Nytto Labs,\n\nI would like a quote for a seller packaging pilot.\nBrand: ${kit.seller}\nProduct / SKU: ${kit.product} / ${kit.sku}\nNumber of SKUs:\nMonthly packages:\nSales channel:\nLanguages / countries:\n\nPlease confirm scope, price and delivery before starting.`)}`;
  return <>
    <header className="seller-heading no-print"><div className="section-kicker">STAYTAG / SELLER KITS</div><h1>Your package.<br /><em>Your next sale.</em></h1><p>Put a reorder card inside your next package. The buyer scans, sees the exact SKU and chooses one of your store links. No competing search results.</p><div className="seller-chips"><span>Free DIY tool</span><span>Your links stay yours</span><span>EN / SV / 中文</span></div></header>
    <form onSubmit={generate} className="seller-form no-print"><fieldset disabled={busy}><legend>Build your reorder card</legend><div className="seller-fields">
      <label>Seller / brand name<input required maxLength={60} value={kit.seller} onChange={e => update({ ...kit, seller: e.target.value })} placeholder="Your brand" /></label>
      <label>Product to reorder<input required maxLength={80} value={kit.product} onChange={e => update({ ...kit, product: e.target.value })} placeholder="Water filter refill pack" /></label>
      <label>Exact SKU / part number<input required maxLength={60} value={kit.sku} onChange={e => update({ ...kit, sku: e.target.value })} placeholder="WF-200 / pack of 3" /></label>
      <label>Card & customer page language<select value={kit.language} onChange={e => update({ ...kit, language: e.target.value as KitLanguage })}><option value="en">English</option><option value="sv">Svenska</option><option value="zh">简体中文</option></select></label>
    </div><p>The card returns to the product you specify, not necessarily the original machine. Check that the SKU and links describe the correct refill.</p>
    {kit.links.map((link, index) => <div className="seller-link-row" key={index}><label>Store / delivery region<input required maxLength={32} value={link.region} onChange={e => update({ ...kit, links: kit.links.map((l, i) => i === index ? { ...l, region: e.target.value } : l) })} placeholder="Europe / your store" /></label><label>Exact product URL<input required type="url" maxLength={400} value={link.url} onChange={e => update({ ...kit, links: kit.links.map((l, i) => i === index ? { ...l, url: e.target.value } : l) })} placeholder="https://your-store.com/products/filter" /></label>{kit.links.length > 1 && <button className="secondary-button" type="button" onClick={() => update({ ...kit, links: kit.links.filter((_, i) => i !== index) })} aria-label={`Remove store ${index + 1}`}>Remove</button>}</div>)}
    <button type="button" className="secondary-button" disabled={kit.links.length >= 3} onClick={() => update({ ...kit, links: [...kit.links, { region: "", url: "" }] })}><Plus size={18} aria-hidden="true" /> Add a regional store ({kit.links.length}/3)</button>
    <div className="seller-warning"><strong>Before putting this in a package</strong><p>Check the sales channel’s rules for packaging inserts, external links and affiliate attribution. This tool is not an approved integration or partnership with any marketplace. StayTag does not check stock, ownership or compatibility, and does not add its own affiliate ID to your links.</p><label className="seller-consent"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} required /><span>I may use these links, have checked the applicable channel rules, and understand that all card data is public.</span></label></div>
    <button type="submit" className="primary-button" disabled={!approved || busy}>{busy ? "Creating your kit…" : "Create my Seller Kit"}<ArrowRight size={18} aria-hidden="true" /></button></fieldset></form>
    <p className="seller-message no-print" role="status" aria-live="polite">{message}</p>
    {result && <section className="seller-result"><div className="seller-card-grid">{Array.from({ length: 2 }, (_, i) => <article className={`seller-card${i ? " seller-print-copy" : ""}`} key={i} lang={result.kit.language}><span className="seller-brand">{result.kit.seller}</span><h2>{kitCopy[result.kit.language].scan}</h2><strong>{result.kit.product}</strong><p>{kitCopy[result.kit.language].sku}: {result.kit.sku}</p><Image unoptimized src={result.qr} width={1200} height={1200} alt="Reorder QR" /><small>StayTag · cycletag.eu</small></article>)}</div><div className="seller-result-tools no-print"><h2>Your package is now a return path.</h2><p>Two cards per A4 sheet, or send the vector QR to your printer. Keep the QR at least 80 mm wide with its white border.</p><a className="primary-button" href={result.url} target="_blank" rel="noopener">Preview customer page <ArrowRight size={18} aria-hidden="true" /></a><button className="secondary-button" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> Print 2 cards / A4</button><button className="secondary-button" onClick={() => triggerDownload(result.qr, "cycletag-seller-qr.png")}><Download size={18} aria-hidden="true" /> Download QR PNG</button><button className="secondary-button" onClick={() => { const url = URL.createObjectURL(new Blob([result.svg], { type: "image/svg+xml" })); triggerDownload(url, "cycletag-seller-qr.svg"); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={18} aria-hidden="true" /> Download vector QR</button><button className="secondary-button" onClick={async () => { try { await copyText(result.url); setMessage("Customer link copied."); } catch { setMessage("Copy failed. Select the link below and copy it manually."); } }}>Copy customer link</button><label>Keep this link as your backup<input readOnly value={result.url} onFocus={e => e.currentTarget.select()} /></label><p>Fixed snapshot: changing a URL requires a new QR. No seller account, click dashboard or revenue tracking. Sales take place in your store.</p></div></section>}
    <aside className="seller-pilot no-print"><div><div className="section-kicker">FOR BRANDS & SUPPLIERS</div><h2>Start with one SKU. Prove repeat demand.</h2><p>Need help preparing a packaging pilot? Send your SKU count, sales channel and print requirements. We’ll agree scope, price and delivery before any paid work. This is a service enquiry, not an automatic order.</p></div><a className="primary-button" href={pilotUrl}>Request a pilot quote →</a></aside>
  </>;
}

