"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowRight, Download, Plus, Printer, Share2, Trash2 } from "lucide-react";
import { marketChoiceLabel } from "@/lib/affiliate";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { listShelf } from "@/lib/shelf";
import { siteUrl } from "@/lib/site";
import { buildSpaceUrl, decodeSpace, SPACE_LIMIT, type SpacePayload } from "@/lib/space";
import { decodeTag, markets, type Market, type TagPayload } from "@/lib/tag";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function snapshot() { return window.location.hash; }
const serverSnapshot = () => "";
const blankItem = (): TagPayload => ({ v: 1, n: "", q: "", c: "home", i: 90, s: "", m: "DE" });
function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function SpacesBuilder() {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const encoded = new URLSearchParams(hash.slice(1)).get("edit");
  const space = decodeSpace(encoded);
  return <SpaceForm key={encoded ?? "new"} initial={space} invalid={Boolean(encoded && !space)} />;
}

function SpaceForm({ initial, invalid }: { initial: SpacePayload | null; invalid: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [items, setItems] = useState<TagPayload[]>(initial?.items ?? [blankItem()]);
  const [result, setResult] = useState<{ space: SpacePayload; url: string; qr: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(invalid ? "That space link is incomplete. Start a new space below." : "");
  const [error, setError] = useState(false);
  const resultRef = useRef<HTMLElement>(null);

  function changed() { setResult(null); setMessage(""); setError(false); }
  function update(index: number, field: Partial<TagPayload>) {
    changed();
    setItems((current) => current.map((item, i) => i === index ? { ...item, ...field } : item));
  }
  function importTags() {
    const tags = listShelf().map((record) => decodeTag(record.encoded)).filter((t): t is TagPayload => Boolean(t));
    if (!tags.length) { setMessage("No saved tags found in this browser. Add an item below, or create individual tags first."); return; }
    changed();
    setItems(tags.slice(0, SPACE_LIMIT));
    setMessage(`${Math.min(tags.length, SPACE_LIMIT)} saved tags loaded. Review them before creating your QR.${tags.length > SPACE_LIMIT ? " Only the six most recent tags were loaded." : ""}`);
  }
  async function generate(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(false); setMessage(""); setResult(null);
    try {
      const space: SpacePayload = { v: 1, name, items: items.map((item) => ({ ...item, s: item.s || today() })) };
      const url = buildSpaceUrl(siteUrl, space);
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, width: 1200, color: { dark: "#171713", light: "#ffffff" } });
      setResult({ space, url, qr });
      setMessage("Your space is ready. Test-scan the QR before printing a batch.");
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (err) { setError(true); setMessage(err instanceof Error ? err.message : "Could not create the QR. Please try again."); }
    finally { setBusy(false); }
  }
  async function share() {
    if (!result) return;
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: result.space.name, text: "One QR. Every refill. Open this CycleTag Space:", url: result.url });
      else await copyText(result.url);
      setError(false); setMessage(canShare ? "Space shared." : "Space link copied.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(true); setMessage("Sharing is unavailable. Select and copy the space link below.");
    }
  }

  return <>
    <header className="spaces-heading no-print">
      <Link href="/">← CycleTag home</Link>
      <div className="section-kicker">NEW / CYCLETAG SPACES</div>
      <h1>One QR.<br /><em>Every refill.</em></h1>
      <p>Your coffee corner, office or workshop. Put up to six replacements behind one QR. Anyone who scans it gets the same list — no account needed.</p>
      <div className="spaces-badges"><span>Free</span><span>No database</span><span>Share with anyone</span></div>
    </header>
    <form onSubmit={generate} className="spaces-form no-print">
      <fieldset disabled={busy}>
        <legend>Build your space</legend>
        <div className="spaces-start"><label>Space name<input required maxLength={60} value={name} placeholder="Office coffee corner" onChange={(e) => { changed(); setName(e.target.value); }} /></label>
          <button type="button" className="secondary-button" onClick={importTags}>Use my saved tags</button></div>
        <p className="spaces-note">Enter the exact models you own. A space opens searches, not guaranteed compatible products.</p>
        <div className="spaces-rows">{items.map((item, index) => <section className="spaces-row" key={index} aria-label={`Item ${index + 1}`}>
          <div className="spaces-row-head"><strong>0{index + 1} / REPLACEMENT</strong><button type="button" aria-label={`Remove item ${index + 1}`} disabled={items.length === 1} onClick={() => { changed(); setItems((current) => current.filter((_, i) => i !== index)); }}><Trash2 size={18} aria-hidden="true" /> Remove</button></div>
          <div className="spaces-fields">
            <label>Item name<input required maxLength={80} value={item.n} placeholder="Coffee machine filter" onChange={(e) => update(index, { n: e.target.value })} /></label>
            <label>Exact model / search<input required maxLength={160} value={item.q} placeholder="e.g. DeLonghi DLSC002 water filter" onChange={(e) => update(index, { q: e.target.value })} /></label>
            <label>Replace every (days)<input required type="number" min={1} max={730} step={1} value={item.i || ""} onChange={(e) => update(index, { i: Number(e.target.value) })} /></label>
            <label>Last replaced<input type="date" value={item.s} onChange={(e) => update(index, { s: e.target.value })} /><small>Blank uses today. Adjust to your actual date.</small></label>
            <label>Marketplace<select value={item.m} onChange={(e) => update(index, { m: e.target.value as Market })}>{markets.map((market) => <option key={market} value={market}>{marketChoiceLabel(market)}</option>)}</select></label>
          </div>
        </section>)}</div>
        <div className="spaces-actions"><button type="button" className="secondary-button" disabled={items.length >= SPACE_LIMIT} onClick={() => { changed(); setItems((current) => [...current, blankItem()]); }}><Plus size={18} aria-hidden="true" /> Add item ({items.length}/{SPACE_LIMIT})</button><button className="primary-button" type="submit" disabled={busy}>{busy ? "Creating your QR…" : "Create my Space QR"}<ArrowRight size={18} aria-hidden="true" /></button></div>
        <p className="spaces-warning">Public by design: anyone with the QR or link can read all names, searches, dates and markets. Don’t include addresses, access codes or private details. A printed QR is a fixed snapshot, not a synced inventory. Changes need a new QR.</p>
      </fieldset>
    </form>
    <p className={`spaces-feedback no-print${error ? " is-error" : ""}`} role="status" aria-live="polite">{message}</p>
    {result && <section ref={resultRef} tabIndex={-1} className="spaces-result" aria-label="Your printable Space QR">
      <div className="space-print-label"><div className="space-label-top">CYCLETAG SPACES <span>{result.space.items.length} ITEMS / ONE SCAN</span></div><h2>{result.space.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="space-qr" src={result.qr} alt={`QR for ${result.space.name}`} width={1200} height={1200} />
        <p>SCAN. CHOOSE. REORDER.</p><small>cycletag.eu · No app. No account.</small></div>
      <div className="spaces-result-tools no-print"><h2>Your space is ready.</h2><p>Put one label on the cupboard. Give everyone the same refill list.</p><div className="spaces-actions">
        <a className="primary-button" href={result.url}>Preview Space <ArrowRight size={18} aria-hidden="true" /></a>
        <button type="button" className="secondary-button" onClick={share}><Share2 size={18} aria-hidden="true" /> Share space</button>
        <button type="button" className="secondary-button" onClick={() => { triggerDownload(result.qr, "cycletag-space-qr.png"); setMessage("QR PNG download started. Keep it at least 10 cm wide when printing and test it with your phone."); }}><Download size={18} aria-hidden="true" /> Download QR PNG</button>
        <button type="button" className="secondary-button" onClick={() => { window.print(); setMessage("Print dialog requested. Choose A4 and 100% scale, then test-scan the printed label."); }}><Printer size={18} aria-hidden="true" /> Print A4 label</button></div>
        <label>Space link<input readOnly value={result.url} onFocus={(e) => e.currentTarget.select()} /></label>
        <p className="spaces-note">Keep the QR at least 10 cm wide. Use the preview to check each model before sharing. Editing this space creates a new label; older labels stay unchanged.</p>
      </div>
    </section>}
  </>;
}
