"use client";

import Link from "next/link";
import { CircleAlert, ExternalLink, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionToast, type ToastTone } from "@/app/action-toast";
import { buildEbayLink, defaultCampaignId, marketChoiceLabel, marketplaceName, validCampaignId } from "@/lib/affiliate";
import { careDue } from "@/lib/care";
import { CareTimeline } from "@/app/care-timeline";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { builderEditHash, decodeTag } from "@/lib/tag";
import { AddToRelay } from "@/app/relay/add-to-relay";

const campaignId = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || defaultCampaignId;

type Flash = { text: string; tone: ToastTone };

export function TagView() {
  const [encoded, setEncoded] = useState<string | null | undefined>(undefined);
  const tag = useMemo(() => encoded === undefined ? undefined : decodeTag(encoded), [encoded]);
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    function readTag() {
      const fragment = new URLSearchParams(window.location.hash.slice(1)).get("d");
      const legacy = new URLSearchParams(window.location.search).get("d");
      setEncoded(fragment ?? legacy);
      setFlash(null);
    }

    readTag();
    window.addEventListener("hashchange", readTag);
    return () => window.removeEventListener("hashchange", readTag);
  }, []);

  if (tag === undefined) {
    return <section className="tag-shell loading-tag" aria-live="polite">Reading tag…</section>;
  }

  if (!tag) {
    return (
      <section className="tag-shell invalid-tag">
        <span className="status-dot"><CircleAlert aria-hidden="true" size={22} /></span>
        <h1>This tag cannot be read.</h1>
        <p>It may be incomplete or damaged. Create a fresh CycleTag in under a minute.</p>
        <Link className="primary-button" href="/">Create a new tag</Link>
      </section>
    );
  }

  const nextDue = careDue(tag);
  const daysUntil = Math.round((Date.parse(`${nextDue}T00:00:00Z`) - Date.parse(new Date().toISOString().slice(0, 10))) / 86400000);
  const cycle = { state: daysUntil <= 0 ? "due" : daysUntil <= 7 ? "soon" : "scheduled", daysUntil };
  const buyUrl = buildEbayLink(tag, campaignId, "scan");
  const affiliateActive = validCampaignId(campaignId);

  function addReminder() {
    if (!tag) return;
    const blob = new Blob([createIcs(tag, window.location.href)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, "cycletag-reminder.ics");
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
    setFlash({ tone: "success", text: "Calendar reminder downloaded. Open the .ics file to add the repeating event." });
  }

  async function share() {
    if (!tag) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: tag.n, text: `Care history for ${tag.n}`, url: window.location.href });
        setFlash({ tone: "success", text: "Tag shared. Anyone with the link can read the encoded item, search and date." });
        return;
      }
      await copyText(window.location.href);
      setFlash({ tone: "success", text: "Tag link copied. Anyone with this link can read the encoded item, search and date." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyText(window.location.href);
        setFlash({ tone: "success", text: "Tag link copied. Anyone with this link can read the encoded item, search and date." });
      } catch {
        setFlash({ tone: "error", text: "Copy failed. Copy the address from the browser instead." });
      }
    }
  }

  return (
    <section className="tag-shell">
      <div className={`due-banner ${cycle.state}`}>
        <span className="status-dot">
          {cycle.state === "due" ? <CircleAlert aria-hidden="true" size={22} /> : <RefreshCcw aria-hidden="true" size={22} />}
        </span>
        <div>
          <small>{daysUntil < 0 ? "CARE OVERDUE" : daysUntil === 0 ? "CARE DUE TODAY" : "NEXT CARE DUE"}</small>
          <strong>{nextDue}</strong>
          <span>{daysUntil < 0 ? `${-daysUntil} days overdue` : daysUntil === 0 ? "Today" : `In ${daysUntil} days`}</span>
        </div>
      </div>

      <div className="tag-product">
        <div className="section-kicker">NYTTO LABS · CYCLETAG CARE PROOF</div>
        <h1>{tag.n}</h1>
        <p className="search-query">Care stays with the machine.</p>
        <div className="tag-meta">
          <span>Every {tag.i} days</span>
          <span>Started {tag.s}</span>
          <span>{tag.care?.marketplace !== false ? marketChoiceLabel(tag.m) : "Care only"}</span>
        </div>
      </div>

      <CareTimeline tag={tag} />
      <Link className="primary-button care-log" href={`/#log=${encoded}`}>Log replacement · create new QR <RefreshCcw size={18} aria-hidden="true" /></Link>
      <p>Logging creates a new sticker with the previous care entries. The old sticker remains a snapshot.</p>
      {tag.care?.marketplace !== false && <><a className="secondary-button" href={buyUrl} target="_blank" rel="nofollow sponsored noopener">
        Find replacement on {marketplaceName(tag.m)} <ExternalLink aria-hidden="true" size={18} />
      </a>
      <p className="affiliate-near-link">
        {affiliateActive
          ? `Affiliate link to ${marketplaceName(tag.m)}: CycleTag may earn a commission, at no extra cost to you.`
          : `Marketplace search on ${marketplaceName(tag.m)}. Affiliate tracking is not configured on this deployment.`}
      </p>

      </>}

      {flash && (
        <div className="tag-flash">
          <ActionToast message={flash.text} tone={flash.tone} />
        </div>
      )}

      <div className="tag-secondary">
        {tag.care?.marketplace !== false && <AddToRelay tag={tag} />}
        <Link href={`/care-sheet#d=${encoded}`}>Print Care Sheet / PDF</Link>
        <button type="button" onClick={addReminder}>Add recurring reminder</button>
        <button type="button" onClick={share}>Share this tag</button>
        <Link href={encoded ? `/${builderEditHash(encoded)}` : "/"}>Correct this tag</Link>
        <Link href="/">Create a different tag</Link>
      </div>
      <p className="tag-edit-note">
        Wrong part number? <Link href={encoded ? `/${builderEditHash(encoded)}` : "/"}>Correct this tag</Link> to print a new QR. This sticker stays as it is — CycleTag has no database that could update it.
      </p>
      <p className="tag-share-note">
        Share, print or bookmark only if this payload can be public. Anyone with the QR or link can read all encoded care fields, dates, photo hashes and marketplace details.
      </p>

      <div className="tag-privacy"><ShieldCheck aria-hidden="true" size={18} /><p><strong>No tag database.</strong> This page was rebuilt from the QR itself. Anyone with the QR or link can read the information encoded in it.</p></div>
    </section>
  );
}
