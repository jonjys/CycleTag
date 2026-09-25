"use client";

import Link from "next/link";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Check, Copy, ExternalLink, Plus, Printer, Send, Trash2 } from "lucide-react";
import { buildEbayLink, defaultCampaignId, marketChoiceLabel, marketplaceName, validCampaignId } from "@/lib/affiliate";
import { copyText } from "@/lib/clipboard";
import { buildRelayUrl, decodeRelay, getRelayServerSnapshot, getRelaySnapshot, parseRelay, relayItemKey, RELAY_LIMIT, subscribeRelay, validateRelay, writeRelay, type RelayItem, type RelayList } from "@/lib/relay";
import { siteUrl } from "@/lib/site";
import { markets, type Market } from "@/lib/tag";

const campaign = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || defaultCampaignId;
const empty: RelayList = { v: 1, items: [] };
const demo: RelayList = { v: 1, items: [
  { n: "Coffee filters", q: "Moccamaster size 4 paper filters", m: "DE", quantity: 2 },
  { n: "Office toner", q: "Brother TN-2420 toner", m: "DE", quantity: 1 },
  { n: "Vacuum bags", q: "Miele GN vacuum bags", m: "DE", quantity: 1 }
] };
const hashSnapshot = () => window.location.hash;
const hashServer = () => "";
function subscribeHash(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }

export function RelayBoard() {
  const hash = useSyncExternalStore(subscribeHash, hashSnapshot, hashServer);
  const raw = useSyncExternalStore(subscribeRelay, getRelaySnapshot, getRelayServerSnapshot);
  const params = new URLSearchParams(hash.slice(1));
  const encoded = params.get("list");
  const isDemo = params.get("demo") === "1";
  const shared = encoded !== null || isDemo;
  const list = isDemo ? demo : shared ? decodeRelay(encoded) : parseRelay(raw);
  if (!list) return <section className="relay-heading"><h1>{shared ? "This list cannot be read." : "Your saved list cannot be read."}</h1><p>{shared ? "Ask the sender for the complete link. Nothing has been added to your device." : "The local data is damaged. Resetting removes only this device’s refill list, not your tags or Spaces."}</p>{shared ? <Link className="primary-button" href="/relay">Open my list</Link> : <ResetList />}</section>;
  return <ListEditor key={shared ? hash : "local"} initial={list} shared={shared} isDemo={isDemo} raw={raw} />;
}
function ResetList() {
  const [error, setError] = useState("");
  return <><button className="secondary-button" onClick={() => { if (window.confirm("Reset this damaged refill list? Saved tags and Spaces are unaffected.")) { try { writeRelay(empty); } catch (e) { setError(String(e)); } } }}>Reset damaged list</button><p role="alert">{error}</p></>;
}
function ListEditor({ initial, shared, isDemo, raw }: { initial: RelayList; shared: boolean; isDemo: boolean; raw: string | null }) {
  const [draft, setDraft] = useState(initial);
  const [sessionOnly, setSessionOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<Set<string>>(new Set());
  const [shareUrl, setShareUrl] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const list = shared || sessionOnly ? draft : parseRelay(raw) ?? empty;
  const pending = list.items.filter(i => !done.has(relayItemKey(i)));
  function change(next: RelayList) {
    setDraft(next); setShareUrl(""); setConfirmed(false);
    if (shared) return;
    try { writeRelay(next); setSessionOnly(false); setMessage("Saved on this device."); }
    catch { setSessionOnly(true); setMessage("Not saved: browser storage is unavailable. This list works for this session only. Share and keep a link before leaving."); }
  }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const item: RelayItem = { n: String(data.get("name") ?? ""), q: String(data.get("query") ?? ""), m: String(data.get("market")) as Market, quantity: Number(data.get("quantity")) };
    const valid = validateRelay({ v: 1, items: [item] });
    if (!valid) { setMessage("Check the item name, exact model, marketplace and quantity."); return; }
    if (list.items.some(i => relayItemKey(i) === relayItemKey(valid.items[0]))) { setMessage("Already on this list. Change its quantity below instead."); return; }
    if (list.items.length >= RELAY_LIMIT) { setMessage("Your list is full. Remove an item first."); return; }
    change({ v: 1, items: [...list.items, valid.items[0]] }); event.currentTarget.reset();
  }
  async function send(copyOnly: boolean) {
    if (!confirmed) return;
    try {
      const url = buildRelayUrl(siteUrl, { v: 1, items: pending });
      setShareUrl(url);
      if (!copyOnly && typeof navigator.share === "function") {
        await navigator.share({ title: "StayTag refill list", text: `${pending.length} refills to check. Exact searches and quantities inside.`, url });
        setMessage("Share dialog completed. Delivery and purchases are not tracked.");
      } else { await copyText(url); setMessage("Link copied. Send it to whoever handles the shopping."); }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "Sharing failed. Copy the generated link below.");
    }
  }
  return <>
    <header className="relay-heading"><div className="section-kicker">NEW / STAYTAG REFILL RELAY</div><h1>Scan it. Send it.<br /><em>Sorted.</em></h1><p>{shared ? "Someone did the finding. You do the buying. Check the exact model and quantity, then open its marketplace search." : "Spot what’s running low. Collect it here. Send one list to the person who buys — at home or at work."}</p>
      <div className="relay-mode">{isDemo ? "DEMO — example models, not compatibility recommendations" : shared ? "RECEIVED SNAPSHOT — edits stay in this tab" : sessionOnly ? "SESSION ONLY — keep a share link before leaving" : "YOUR DEVICE — no account or live sync"}</div>
    </header>
    <div className="relay-workspace">
      <section aria-label="Refill list" className="relay-list">
        <div className="relay-list-heading"><h2>{shared ? "The handoff" : "Your refill list"}</h2><span>{pending.length} to get / {list.items.length} items</span></div>
        {!list.items.length && <div className="relay-empty"><h3>Your next refill starts here.</h3><p>Scan any existing StayTag and tap “Need this”. Keep scanning to collect items from different rooms or Spaces.</p><a href="#demo=1" className="secondary-button">Try a 3-item handoff →</a><p>Or add your first item using the form.</p></div>}
        {list.items.map(item => {
          const key = relayItemKey(item), checked = done.has(key);
          return <article className={`relay-item${checked ? " is-done" : ""}`} key={key}>
            <div className="relay-item-head"><h3>{item.n}</h3><span>{marketplaceName(item.m)}</span></div>
            <p className="relay-query">{item.q}</p>
            <div className="relay-item-tools"><label>Quantity<select aria-label={`Quantity for ${item.n}`} value={item.quantity} onChange={event => change({ v: 1, items: list.items.map(i => relayItemKey(i) === key ? { ...i, quantity: Number(event.target.value) } : i) })}>{Array.from({ length: 99 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label>
              <label className="relay-check"><input type="checkbox" checked={checked} onChange={() => { setDone(previous => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next; }); setShareUrl(""); setConfirmed(false); }} /><span>Got it</span></label>
              <button type="button" className="relay-remove no-print" aria-label={`Remove ${item.n}`} onClick={() => { change({ v: 1, items: list.items.filter(i => relayItemKey(i) !== key) }); setDone(previous => { const next = new Set(previous); next.delete(key); return next; }); }}><Trash2 size={18} aria-hidden="true" /></button>
            </div>
            <a className="primary-button no-print" href={buildEbayLink({ ...item, v: 1, c: "other", i: 90, s: "2026-01-01" }, campaign, "scan")} target="_blank" rel="nofollow sponsored noopener">Find on {marketplaceName(item.m)} <ExternalLink size={18} aria-hidden="true" /></a>
          </article>;
        })}
        {list.items.length > 0 && !pending.length && <div className="relay-complete"><Check size={24} aria-hidden="true" /><h3>All checked off.</h3><p>“Got it” is your checklist, not a confirmed order or a message to the sender.</p></div>}
      </section>
      <aside className="relay-sidebar no-print">
        <section className="relay-send"><div className="section-kicker">THE HANDOFF</div><h2>{shared ? "Pass the rest on." : "Someone else buying?"}</h2><p>Send {pending.length} unchecked item{pending.length === 1 ? "" : "s"}, with exact searches and quantities. No account needed to open the list.</p><label className="relay-consent"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>I checked the list. Anyone with the link can read it. No private details.</span></label><button className="primary-button" disabled={!pending.length || !confirmed} onClick={() => send(false)}><Send size={18} aria-hidden="true" /> Share refill list</button><button className="secondary-button" disabled={!pending.length || !confirmed} onClick={() => send(true)}><Copy size={18} aria-hidden="true" /> Copy list link</button><button className="secondary-button" disabled={!list.items.length} onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> Print checklist</button>{shareUrl && <label className="relay-link">Share link<input readOnly value={shareUrl} onFocus={e => e.currentTarget.select()} /><a href={shareUrl} target="_blank" rel="noopener">Preview recipient’s list →</a></label>}<p className="relay-fine">A snapshot, not live sync. “Got it” stays in this tab and resets on reload. To send an updated list, share again. Nothing is purchased automatically.</p></section>
        <details className="relay-form" open={!list.items.length}><summary><Plus size={18} aria-hidden="true" /> Add a refill manually</summary><form onSubmit={add}><label>Item name<input name="name" required maxLength={80} placeholder="Office coffee filters" /></label><label>Exact model / search<input name="query" required maxLength={160} placeholder="Brand + model + part number" /></label><div className="relay-form-row"><label>Quantity<input name="quantity" type="number" min={1} max={99} step={1} defaultValue={1} required /></label><label>Marketplace<select name="market" defaultValue="DE">{markets.map(m => <option value={m} key={m}>{marketChoiceLabel(m)}</option>)}</select></label></div><button className="secondary-button" disabled={list.items.length >= RELAY_LIMIT}>Add to list <Plus size={18} aria-hidden="true" /></button></form></details>
        {shared ? <Link href="/relay" className="secondary-button">Open my own refill list →</Link> : <Link href="/spaces" className="secondary-button">Create a Space QR →</Link>}
      </aside>
    </div>
    <p className="relay-feedback no-print" role="status" aria-live="polite">{message}</p>
    <p className="relay-fine">{validCampaignId(campaign) ? "Marketplace links are affiliate links. StayTag may earn a commission at no extra cost to you. " : ""}Confirm compatibility, pack size, price and delivery with the seller. Quantity is your requested number of units or packs — it is not sent to a marketplace cart.</p>
    <p className="relay-fine">Your own list is stored only in this browser when storage is available. Clearing site data removes it. Received lists never overwrite it. Shared names, searches, quantities and markets live in the link, not a StayTag database; links can be forwarded. <Link href="/privacy">Privacy details</Link>.</p>
  </>;
}

