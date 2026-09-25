"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, ExternalLink, Share2 } from "lucide-react";
import { buildEbayLink, defaultCampaignId, marketplaceName, validCampaignId } from "@/lib/affiliate";
import { copyText } from "@/lib/clipboard";
import { calculateCycle, formatDate } from "@/lib/cycle";
import { saveShelfTag } from "@/lib/shelf";
import { buildSpaceUrl, decodeSpace, type SpacePayload } from "@/lib/space";
import { siteUrl } from "@/lib/site";
import { encodeTag } from "@/lib/tag";
import { AddToRelay } from "@/app/relay/add-to-relay";

function subscribe(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }
const snapshot = () => window.location.hash;
const serverSnapshot = () => null;
const campaign = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || defaultCampaignId;

export function SpaceView() {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  if (hash === null) return <p className="spaces-feedback" role="status">Opening your space…</p>;
  const encoded = new URLSearchParams(hash.slice(1)).get("d");
  const space = decodeSpace(encoded);
  if (!space || !encoded) return <section className="spaces-heading"><h1>This space cannot be read.</h1><p>The link may be incomplete. Ask the sender for the full link or create your own space.</p><Link className="primary-button" href="/spaces">Create a Space</Link></section>;
  return <SharedSpace key={encoded} space={space} encoded={encoded} />;
}

function SharedSpace({ space, encoded }: { space: SpacePayload; encoded: string }) {
  const [message, setMessage] = useState("");
  const url = buildSpaceUrl(siteUrl, space);
  async function share() {
    const canShare = typeof navigator.share === "function";
    try {
      if (canShare) await navigator.share({ title: space.name, text: "Open our StayTag refill space", url });
      else await copyText(url);
      setMessage(canShare ? "Space shared." : "Link copied.");
    } catch (err) { if (!(err instanceof Error && err.name === "AbortError")) setMessage("Sharing failed. Copy the full address from your browser."); }
  }
  function save() {
    let saved = 0;
    for (const item of space.items) if (saveShelfTag(item, encodeTag(item)).ok) saved += 1;
    setMessage(saved === space.items.length ? `${saved} items saved to My tags on this device. Clearing browser data removes these local copies.` : `${saved} of ${space.items.length} items saved. Browser storage may be blocked or full. Keep the space link as a backup.`);
  }
  return <>
    <header className="spaces-heading"><div className="section-kicker">STAYTAG SPACES / {space.items.length} REPLACEMENTS</div><h1>{space.name}</h1><p>Everything you replace, one scan away. Choose an item to reopen its exact marketplace search.</p><div className="spaces-actions"><button type="button" className="primary-button" onClick={share}><Share2 size={18} aria-hidden="true" /> Share space</button><button type="button" className="secondary-button" onClick={save}>Save items to My tags</button></div></header>
    <p className="spaces-feedback" role="status" aria-live="polite">{message}</p>
    <section className="spaces-share-band no-print"><div className="section-kicker">NEW / REFILL RELAY</div><h2>Running low? Hand it off.</h2><p>Add the items you need below. Scan other labels to grow the same list, then send it to whoever buys.</p><Link className="primary-button" href="/relay">Open my refill list →</Link></section>
    <section className="space-item-grid" aria-label="Items in this space">{space.items.map((item, index) => {
      const cycle = calculateCycle(item.s, item.i);
      return <article className="space-item" key={index}><div className="space-item-number">0{index + 1}<span>{marketplaceName(item.m)}</span></div><h2>{item.n}</h2><p className="space-query">{item.q}</p><dl><div><dt>Replacement cycle</dt><dd>Every {item.i} days</dd></div><div><dt>Next scheduled date</dt><dd>{formatDate(cycle.nextDue)}</dd></div></dl><a className="primary-button" href={buildEbayLink(item, campaign, "scan")} target="_blank" rel="nofollow sponsored noopener">Find on {marketplaceName(item.m)}<ExternalLink size={18} aria-hidden="true" /></a><Link className="space-detail-link" href={`/tag#d=${encodeTag(item)}`}>Details & calendar reminder <ArrowRight size={16} aria-hidden="true" /></Link><AddToRelay tag={item} /></article>;
    })}</section>
    <p className="spaces-note">{validCampaignId(campaign) ? "Marketplace links are affiliate links. StayTag may earn a commission at no extra cost to you. " : ""}Check the model, seller, price and delivery before buying. Compatibility and availability are not guaranteed.</p>
    <aside className="spaces-share-band"><div><div className="section-kicker">PASS IT ON</div><h2>Your kitchen deserves one too.</h2><p>Create your own space, or adapt this list to your actual models.</p></div><div className="spaces-actions"><Link className="primary-button" href="/spaces">Create my own Space <ArrowRight size={18} aria-hidden="true" /></Link><Link className="secondary-button" href={`/spaces#edit=${encoded}`}>Copy & customize this space</Link></div></aside>
    <p className="spaces-warning">This is a shared snapshot, not a live inventory. Dates are calculated from the original setup, not confirmed replacements. Anyone with this QR can read its contents. No account, database or cross-device tracking. Changes require a new QR; saving items only affects this browser.</p>
  </>;
}

