"use client";

import Link from "next/link";
import { CircleAlert, ExternalLink, RefreshCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionToast, type ToastTone } from "@/app/action-toast";
import { buildEbayLink, defaultCampaignId, validCampaignId } from "@/lib/affiliate";
import { calculateCycle, formatDate } from "@/lib/cycle";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { builderEditHash, decodeTag } from "@/lib/tag";

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

  const cycle = calculateCycle(tag.s, tag.i);
  const buyUrl = buildEbayLink(tag, campaignId);
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
        await navigator.share({ title: tag.n, text: `Reorder ${tag.n}`, url: window.location.href });
        setFlash({ tone: "success", text: "Tag shared." });
        return;
      }
      await copyText(window.location.href);
      setFlash({ tone: "success", text: "Tag link copied. Anyone with this link can open the reorder page." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyText(window.location.href);
        setFlash({ tone: "success", text: "Tag link copied. Anyone with this link can open the reorder page." });
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
          <small>{cycle.state === "due" ? "REPLACEMENT DUE TODAY" : cycle.state === "soon" ? "COMING UP" : "NEXT REPLACEMENT"}</small>
          <strong>{formatDate(cycle.nextDue)}</strong>
          <span>{cycle.daysUntil === 0 ? "Today" : `In ${cycle.daysUntil} day${cycle.daysUntil === 1 ? "" : "s"}`}</span>
        </div>
      </div>

      <div className="tag-product">
        <div className="section-kicker">YOUR CYCLETAG</div>
        <h1>{tag.n}</h1>
        <p className="search-query">{tag.q}</p>
        <div className="tag-meta"><span>Every {tag.i} days</span><span>Started {tag.s}</span><span>{tag.m} market</span></div>
      </div>

      <a className="buy-button" href={buyUrl} target="_blank" rel="nofollow sponsored noopener">
        Find replacement on eBay <ExternalLink aria-hidden="true" size={18} />
      </a>
      <p className="affiliate-near-link">
        {affiliateActive ? "Affiliate link: CycleTag may earn a commission, at no extra cost to you." : "Marketplace search. Affiliate tracking is not configured on this deployment."}
      </p>

      {flash && (
        <div className="tag-flash">
          <ActionToast message={flash.text} tone={flash.tone} />
        </div>
      )}

      <div className="tag-secondary">
        <button type="button" onClick={addReminder}>Add recurring reminder</button>
        <button type="button" onClick={share}>Share this tag</button>
        <Link href={encoded ? `/${builderEditHash(encoded)}` : "/"}>Correct this tag</Link>
        <Link href="/">Create a different tag</Link>
      </div>
      <p className="tag-edit-note">
        Wrong part number? <Link href={encoded ? `/${builderEditHash(encoded)}` : "/"}>Correct this tag</Link> to print a new QR. This sticker stays as it is — CycleTag has no database that could update it.
      </p>

      <div className="tag-privacy"><ShieldCheck aria-hidden="true" size={18} /><p><strong>No tag database.</strong> This page was rebuilt from the QR itself. Anyone with the QR or link can read the information encoded in it.</p></div>
    </section>
  );
}
