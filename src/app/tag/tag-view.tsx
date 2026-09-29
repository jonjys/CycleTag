"use client";

import { useLocale } from "@/lib/locale";
import Link from "next/link";
import QRCode from "qrcode";
import { Bell, CalendarDays, Check, CircleAlert, Copy, Download, ExternalLink, Printer, RefreshCcw, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActionToast, type ToastTone } from "@/app/action-toast";
import { buildEbayLink, defaultCampaignId, marketplaceName, validCampaignId } from "@/lib/affiliate";
import { careDue, careEvents, droppedEntries, replacedOn } from "@/lib/care";
import { CareTimeline } from "@/app/care-timeline";
import { copyText } from "@/lib/clipboard";
import { formatDate } from "@/lib/cycle";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { measure } from "@/lib/measure-client";
import { saveShelfTag } from "@/lib/shelf";
import { siteHost, siteUrl } from "@/lib/site";
import { builderEditHash, buildTagUrl, decodeTag, encodeTag, type TagPayload } from "@/lib/tag";
import { AddToRelay } from "@/app/relay/add-to-relay";

const campaignId = process.env.NEXT_PUBLIC_EBAY_CAMPAIGN_ID || defaultCampaignId;

type Flash = { text: string; tone: ToastTone };
type T = (en: string, sv: string) => string;

function localToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "item";
}

function downloadIcs(tag: TagPayload, url: string) {
  const href = URL.createObjectURL(new Blob([createIcs(tag, url)], { type: "text/calendar;charset=utf-8" }));
  triggerDownload(href, `${slug(tag.n)}-staytag-reminder.ics`);
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

export function TagView() {
  const { t, locale } = useLocale();
  const [encoded, setEncoded] = useState<string | null | undefined>(undefined);
  const tag = useMemo(() => encoded === undefined ? undefined : decodeTag(encoded), [encoded]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [today] = useState(localToday);
  const counted = useRef("");

  useEffect(() => {
    function readTag() {
      const fragment = new URLSearchParams(window.location.hash.slice(1)).get("d");
      const legacy = new URLSearchParams(window.location.search).get("d");
      setEncoded(fragment ?? legacy);
      setFlash(null);
      window.scrollTo({ top: 0 });
    }

    readTag();
    window.addEventListener("hashchange", readTag);
    return () => window.removeEventListener("hashchange", readTag);
  }, []);

  useEffect(() => {
    if (!tag || !encoded || counted.current === encoded) return;
    counted.current = encoded;
    measure("tag_scanned", "tag");
  }, [tag, encoded]);

  if (tag === undefined) {
    return <section className="tag-shell loading-tag" aria-live="polite">{t("Reading tag…", "Läser etiketten…")}</section>;
  }

  if (!tag || !encoded) {
    return (
      <section className="tag-shell invalid-tag">
        <span className="status-dot"><CircleAlert aria-hidden="true" size={22} /></span>
        <h1>{t("This tag cannot be read.", "Etiketten kan inte läsas.")}</h1>
        <p>{t("It may be incomplete or damaged. Create a fresh StayTag in under a minute.", "Den kan vara ofullständig eller skadad. Skapa en ny StayTag på under en minut.")}</p>
        <Link className="primary-button" href="/">{t("Create a new tag", "Skapa en ny etikett")}</Link>
      </section>
    );
  }

  const nextDue = careDue(tag);
  const daysUntil = daysBetween(today, nextDue);
  const state = daysUntil < 0 ? "due" : daysUntil <= Math.min(7, Math.ceil(tag.i / 4)) ? "soon" : "scheduled";
  const dateLocale = locale === "sv" ? "sv-SE" : "en-GB";
  const dueText = formatDate(new Date(`${nextDue}T00:00:00Z`), dateLocale);
  const lastText = formatDate(new Date(`${tag.s}T00:00:00Z`), dateLocale);
  const headline = daysUntil < 0
    ? t(`Overdue — ${-daysUntil} day${daysUntil === -1 ? "" : "s"}`, `Försenad — ${-daysUntil} ${daysUntil === -1 ? "dag" : "dagar"}`)
    : daysUntil === 0 ? t("Replacement due today", "Byte i dag")
      : state === "soon" ? t(`Replacement due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, `Byte om ${daysUntil} ${daysUntil === 1 ? "dag" : "dagar"}`)
        : t(`Next replacement: ${daysUntil} days`, `Nästa byte: om ${daysUntil} dagar`);
  const marketplaceOn = tag.care?.marketplace !== false;
  const buyUrl = marketplaceOn ? buildEbayLink(tag, campaignId, "scan") : null;
  const affiliateActive = validCampaignId(campaignId);
  const part = tag.care?.part;
  const partSearchUrl = `https://www.google.com/search?q=${encodeURIComponent([part, tag.n].filter(Boolean).join(" "))}`;
  const manualUrl = `https://www.google.com/search?q=${encodeURIComponent([part, tag.n, "user manual official filetype:pdf"].filter(Boolean).join(" "))}`;
  const entries = careEvents(tag).length;

  function addReminder() {
    if (!tag) return;
    downloadIcs(tag, window.location.href);
    setFlash({ tone: "success", text: t("Calendar reminder downloaded. Open the .ics file to add the repeating event.", "Kalenderpåminnelsen är nedladdad. Öppna .ics-filen för att lägga till den återkommande händelsen.") });
  }

  async function copyPart() {
    if (!part) return;
    try { await copyText(part); setFlash({ tone: "success", text: t(`Part number ${part} copied.`, `Artikelnummer ${part} kopierat.`) }); }
    catch { setFlash({ tone: "error", text: t("Copy failed.", "Kopieringen misslyckades.") }); }
  }

  async function share() {
    if (!tag) return;
    const sharedText = t("Tag link copied. Anyone with this link can read the encoded item, search and date.", "Länken är kopierad. Alla med länken kan läsa vara, sökning och datum.");
    try {
      if (navigator.share) {
        await navigator.share({ title: tag.n, text: `Care history for ${tag.n}`, url: window.location.href });
        setFlash({ tone: "success", text: t("Tag shared. Anyone with the link can read the encoded item, search and date.", "Etiketten är delad. Alla med länken kan läsa innehållet.") });
        return;
      }
      await copyText(window.location.href);
      setFlash({ tone: "success", text: sharedText });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await copyText(window.location.href);
        setFlash({ tone: "success", text: sharedText });
      } catch {
        setFlash({ tone: "error", text: t("Copy failed. Copy the address from the browser instead.", "Kopieringen misslyckades. Kopiera adressen från webbläsaren.") });
      }
    }
  }

  return (
    <section className="tag-shell">
      <div className={`due-banner ${state}`} role="status">
        <span className="status-dot">
          {state === "due" ? <CircleAlert aria-hidden="true" size={22} /> : <RefreshCcw aria-hidden="true" size={22} />}
        </span>
        <div>
          <small>{t("STAYTAG · CARE STATUS", "STAYTAG · SKÖTSELSTATUS")}</small>
          <strong className="due-headline">{headline}</strong>
          <span>{t(`Due ${dueText} · last changed ${lastText}`, `Byte ${dueText} · senast bytt ${lastText}`)}</span>
        </div>
      </div>

      <div className="tag-product">
        <div className="section-kicker">{t("WHAT IS THIS?", "VAD ÄR DETTA?")}</div>
        <h1>{tag.n}</h1>
        {part ? <p className="tag-part"><span>{t("Exact part", "Exakt del")}</span><strong>{part}</strong><button type="button" onClick={copyPart} aria-label={t(`Copy part number ${part}`, `Kopiera artikelnummer ${part}`)}><Copy size={16} aria-hidden="true" /></button></p>
          : <p className="search-query">{t("No part number recorded. Add it next time you log a replacement.", "Inget artikelnummer sparat. Lägg till det nästa gång du loggar ett byte.")}</p>}
        <div className="tag-meta">
          <span>{t(`Every ${tag.i} days`, `Var ${tag.i}:e dag`)}</span>
          <span>{t(`${entries} care entr${entries === 1 ? "y" : "ies"}`, `${entries} ${entries === 1 ? "skötselpost" : "skötselposter"}`)}</span>
        </div>
      </div>

      <ReplaceNow key={encoded} tag={tag} today={today} t={t} dateLocale={dateLocale} early={state === "scheduled"} />

      <div className="tag-quick no-print" aria-label={t("Next steps", "Nästa steg")}>
        {buyUrl
          ? <a className="secondary-button" href={buyUrl} target="_blank" rel="nofollow sponsored noopener"><Search size={18} aria-hidden="true" /> {t("Find the part on", "Hitta delen på")} {marketplaceName(tag.m)} <ExternalLink aria-hidden="true" size={16} /></a>
          : <a className="secondary-button" href={partSearchUrl} target="_blank" rel="noopener noreferrer"><Search size={18} aria-hidden="true" /> {t("Find the part", "Hitta delen")} <ExternalLink aria-hidden="true" size={16} /></a>}
        <button type="button" className="secondary-button" onClick={addReminder}><Bell size={18} aria-hidden="true" /> {t("Set a reminder", "Sätt en påminnelse")}</button>
      </div>
      {buyUrl && <p className="affiliate-near-link">
        {affiliateActive
          ? t(`Optional affiliate link to ${marketplaceName(tag.m)}: StayTag may earn a commission, at no extra cost to you.`, `Valfri affiliatelänk till ${marketplaceName(tag.m)}: StayTag kan få provision, utan extra kostnad för dig.`)
          : `Marketplace search on ${marketplaceName(tag.m)}. Affiliate tracking is not configured on this deployment.`}
      </p>}
      <AddToRelay tag={tag} />

      {flash && (
        <div className="tag-flash">
          <ActionToast message={flash.text} tone={flash.tone} />
        </div>
      )}

      <div className="tag-history">
        <div className="section-kicker">{t("WHAT HAPPENED BEFORE?", "VAD HAR HÄNT TIDIGARE?")}</div>
        <CareTimeline tag={tag} compact />
      </div>

      <div className="tag-secondary no-print">
        <a href={manualUrl} target="_blank" rel="noopener noreferrer">{t("Search the manual", "Sök manualen")} ↗</a>
        <Link href={`/care-sheet#d=${encoded}`}>{t("Print Care Sheet / PDF", "Skriv ut skötselark / PDF")}</Link>
        <button type="button" onClick={share}>{t("Share this tag", "Dela etiketten")}</button>
        <Link href={`/${builderEditHash(encoded)}`}>{t("Correct this tag", "Rätta etiketten")}</Link>
        <Link href="/">{t("Create a different tag", "Skapa en annan etikett")}</Link>
        <Link href="/returns">{t("Return Wallet", "Returplånbok")}</Link>
      </div>
      <p className="tag-edit-note">
        {t("Wrong part number?", "Fel artikelnummer?")} <Link href={`/${builderEditHash(encoded)}`}>{t("Correct this tag", "Rätta etiketten")}</Link> {t("to print a new QR. This sticker stays as it is — StayTag has no database that could update it.", "för att skriva ut en ny QR. Den här etiketten ändras inte — StayTag har ingen databas som kan uppdatera den.")}
      </p>

      <div className="tag-privacy"><ShieldCheck aria-hidden="true" size={18} /><p><strong>{t("No tag database.", "Ingen etikettdatabas.")}</strong> {t("This page was rebuilt from the QR itself. Anyone with the QR or link can read the information encoded in it.", "Sidan byggdes upp från själva QR-koden. Alla med QR-koden eller länken kan läsa innehållet.")}</p></div>
    </section>
  );
}

type Result = { tag: TagPayload; url: string; qr: string; dropped: number; saved: boolean };

function ReplaceNow({ tag, today, t, dateLocale, early }: { tag: TagPayload; today: string; t: T; dateLocale: string; early: boolean }) {
  const [otherDay, setOtherDay] = useState(false);
  const [day, setDay] = useState(today < tag.s ? tag.s : today);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  async function log(when: string) {
    setError("");
    if (when < tag.s) { setError(t(`Pick a day on or after the last change (${tag.s}).`, `Välj en dag från och med senaste bytet (${tag.s}).`)); return; }
    if (when > today) { setError(t("Pick today or an earlier day.", "Välj i dag eller en tidigare dag.")); return; }
    setBusy(true);
    try {
      const next = replacedOn(tag, when);
      const url = buildTagUrl(siteUrl, next);
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 900, margin: 4, color: { dark: "#171713", light: "#ffffff" } });
      const saved = saveShelfTag(next, encodeTag(next)).ok;
      setResult({ tag: next, url, qr, dropped: droppedEntries(tag, next), saved });
      measure("replacement_logged", "tag");
      requestAnimationFrame(() => panel.current?.focus());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("That could not be logged.", "Det gick inte att logga."));
    } finally { setBusy(false); }
  }

  if (result) {
    const due = careDue(result.tag);
    const dueText = formatDate(new Date(`${due}T00:00:00Z`), dateLocale);
    const inDays = daysBetween(today, due);
    return <div className="replace-result" ref={panel} tabIndex={-1} aria-labelledby="replace-done">
      <div className="replace-done no-print">
        <span className="replace-check" aria-hidden="true"><Check size={26} strokeWidth={3} /></span>
        <div>
          <h2 id="replace-done">{t("Logged. Next one:", "Loggat. Nästa byte:")} {dueText}</h2>
          <p>{t(`In ${inDays} days. Your history moved to the new label.`, `Om ${inDays} dagar. Historiken följer med till den nya etiketten.`)}</p>
        </div>
      </div>
      <div className="label-preview printable">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={result.qr} alt={t(`New QR code for ${result.tag.n}`, `Ny QR-kod för ${result.tag.n}`)} />
        <div>
          <span>SCAN FOR CARE HISTORY</span>
          <strong>{result.tag.n}</strong>
          <small>{result.tag.care?.part && `Part ${result.tag.care.part} · `}Last replaced {result.tag.s} · Next due {due} · {siteHost}</small>
        </div>
      </div>
      <ol className="replace-steps no-print">
        <li><strong>{t("Print or download", "Skriv ut eller ladda ner")}</strong> {t("the new label.", "den nya etiketten.")}</li>
        <li><strong>{t("Stick it over the old one.", "Klistra den över den gamla.")}</strong> {t("The old QR still shows the previous dates.", "Den gamla QR-koden visar fortfarande de gamla datumen.")}</li>
        <li><strong>{t("Done.", "Klart.")}</strong> {result.saved ? t("Saved in My tags on this device.", "Sparad i Mina etiketter på enheten.") : t("This browser could not save it to My tags — print or download it now.", "Webbläsaren kunde inte spara den i Mina etiketter — skriv ut eller ladda ner nu.")}</li>
      </ol>
      {result.dropped > 0 && <p className="replace-note no-print">{t(`The oldest ${result.dropped === 1 ? "entry" : `${result.dropped} entries`} did not fit on the new sticker. Your old sticker still holds ${result.dropped === 1 ? "it" : "them"}.`, `${result.dropped === 1 ? "Den äldsta posten" : `De ${result.dropped} äldsta posterna`} fick inte plats på den nya etiketten. Den gamla etiketten har kvar ${result.dropped === 1 ? "den" : "dem"}.`)}</p>}
      <div className="replace-actions no-print">
        <button type="button" className="primary-button" onClick={() => window.print()}><Printer size={18} aria-hidden="true" /> {t("Print new label", "Skriv ut ny etikett")}</button>
        <button type="button" className="secondary-button" onClick={() => { triggerDownload(result.qr, `${slug(result.tag.n)}-staytag.png`); measure("png_downloaded", "tag"); }}><Download size={18} aria-hidden="true" /> {t("Download PNG", "Ladda ner PNG")}</button>
        <button type="button" className="secondary-button" onClick={() => downloadIcs(result.tag, result.url)}><Bell size={18} aria-hidden="true" /> {t("Remind me next time", "Påminn mig nästa gång")}</button>
        <a className="secondary-button" href={`/tag${new URL(result.url).hash}`}>{t("Open the new record", "Öppna den nya posten")}</a>
      </div>
    </div>;
  }

  return <div className="replace-now no-print">
    <button type="button" className="primary-button replace-button" onClick={() => void log(today)} disabled={busy}>
      <RefreshCcw size={20} aria-hidden="true" /> {busy ? t("Creating new label…", "Skapar ny etikett…") : t("I replaced it today", "Jag bytte den i dag")}
    </button>
    <p className="replace-sub">{early ? t("Changed it early? Tap once. You get a new label with the history on it.", "Bytte du tidigare? Ett tryck. Du får en ny etikett med historiken.") : t("Changed it? Tap once. You get a new label with the history on it.", "Bytt? Ett tryck. Du får en ny etikett med historiken.")}</p>
    {otherDay ? <div className="replace-day">
      <label htmlFor="replace-date">{t("Replaced on", "Bytt den")}</label>
      <input id="replace-date" type="date" value={day} min={tag.s} max={today} onChange={e => setDay(e.target.value)} />
      <button type="button" className="secondary-button" onClick={() => void log(day)} disabled={busy || !day}>{t("Log this day", "Logga den dagen")}</button>
    </div> : <button type="button" className="replace-other" onClick={() => setOtherDay(true)}><CalendarDays size={16} aria-hidden="true" /> {t("It was another day", "Det var en annan dag")}</button>}
    {error && <p role="alert" className="replace-error">{error}</p>}
  </div>;
}
