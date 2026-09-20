"use client";

import QRCode from "qrcode";
import { ArrowRight, CheckCircle2, Coffee, Droplets, PawPrint, Printer, ShieldCheck, Wrench, Wind, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ActionToast, type ToastTone } from "./action-toast";
import { CareTimeline } from "./care-timeline";
import {
  buildEbayLink,
  defaultCampaignId,
  marketChoiceLabel,
  marketDestinationNote,
  marketplaceName
} from "@/lib/affiliate";
import { careDue, hashPhoto, logReplacement } from "@/lib/care";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { presets, type Preset } from "@/lib/presets";
import { siteUrl } from "@/lib/site";
import { saveShelfTag } from "@/lib/shelf";
import { buildTagUrl, encodeTag, categories, markets, type Market, type TagCategory, type TagPayload } from "@/lib/tag";

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

type Generated = { tag: TagPayload; url: string; qr: string };
type Flash = { text: string; tone: ToastTone };

const presetIcons: Record<Preset["icon"], LucideIcon> = {
  printer: Printer,
  water: Droplets,
  coffee: Coffee,
  vacuum: Wind,
  pet: PawPrint,
  workshop: Wrench
};

type GeneratorProps = {
  initialPreset?: Preset;
  initialTag?: TagPayload;
  reissuing?: boolean;
  logging?: boolean;
  reprinting?: boolean;
  showPresets?: boolean;
  title?: string;
  description?: string;
};

export function Generator({
  initialPreset,
  initialTag,
  reissuing = false,
  logging = false,
  reprinting = false,
  showPresets = true,
  title: builderTitle = reprinting
    ? "Print this tag again"
    : reissuing
      ? "Correct this tag"
      : "What did you care for?",
  description = reprinting
    ? "The saved label is unchanged. Print it, or edit the fields to create a new QR."
    : reissuing
      ? "Fix the name or part number, then create a new QR. The old sticker is unchanged."
      : "Record the exact item and when you replaced it. Print its care history onto a sticker."
}: GeneratorProps = {}) {
  const [name, setName] = useState(initialTag?.n ?? initialPreset?.name ?? "");
  const [query, setQuery] = useState(initialTag?.q ?? initialPreset?.query ?? "");
  const [category, setCategory] = useState<TagCategory>(initialTag?.c ?? initialPreset?.category ?? "home");
  const [interval, setInterval] = useState(initialTag?.i ?? initialPreset?.interval ?? 90);
  const [start, setStart] = useState(logging ? today : initialTag?.s ?? today);
  const [part, setPart] = useState(initialTag?.care?.part ?? "");
  const [photo, setPhoto] = useState(logging ? "" : initialTag?.care?.photo ?? "");
  const [hashing, setHashing] = useState(false);
  const photoRequest = useRef(0);
  const [marketplace, setMarketplace] = useState(initialTag ? initialTag.care?.marketplace ?? true : false);
  const [market, setMarket] = useState<Market>(initialTag?.m ?? "DE");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const canGenerate = name.trim().length > 0 && !hashing && interval >= 1 && interval <= 730 && start.length > 0;
  const draftTag = useMemo<TagPayload | null>(() => {
    if (!canGenerate) return null;
    const draft: TagPayload = { v: 1, n: name.trim(), q: query.trim() || [name.trim(), part.trim()].filter(Boolean).join(" "), c: category, i: interval, s: start, m: market };
    if (reprinting && initialTag && !initialTag.care && name === initialTag.n && query === initialTag.q && start === initialTag.s && interval === initialTag.i && market === initialTag.m && !part && !photo) return initialTag;
    draft.care = { ...(part.trim() ? { part: part.trim() } : {}), ...(photo ? { photo } : {}), history: initialTag?.care?.history ?? [], marketplace };
    return draft;
  }, [canGenerate, name, query, category, interval, start, market, part, photo, marketplace, initialTag, reprinting]);
  const draftError = useMemo(() => {
    if (!draftTag) return "";
    try { buildTagUrl(siteUrl, logging && initialTag ? logReplacement(initialTag, draftTag) : draftTag); return ""; }
    catch (error) { return error instanceof Error ? error.message : "Check your care details."; }
  }, [draftTag, logging, initialTag]);
  const draftUrl = useMemo(() => {
    if (!draftTag) return "";
    try {
      return buildTagUrl(siteUrl, logging && initialTag ? logReplacement(initialTag, draftTag) : draftTag);
    } catch {
      return "";
    }
  }, [draftTag, logging, initialTag]);
  const instantBuyUrl = draftTag && marketplace ? buildEbayLink(draftTag, defaultCampaignId, "instant") : "";
  const printerUrl = generated
    ? buildEbayLink(
        { ...generated.tag, q: "50mm Bluetooth thermal label printer QR code", c: "office" },
        defaultCampaignId,
        "printer"
      )
    : "";

  useEffect(() => {
    if (generated) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      resultRef.current?.scrollIntoView({ behavior, block: "start" });
    }
  }, [generated]);

  useEffect(() => {
    if (!reprinting) return;
    void generateLabel();
    // Reprint once from the saved payload; later field edits still require Create.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reprinting]);

  function choosePreset(preset: Preset) {
    setName(preset.name);
    setQuery(preset.query);
    setCategory(preset.category);
    setInterval(preset.interval);
    setGenerated(null);
    setFlash(null);
  }

  function invalidate() {
    setGenerated(null);
    setFlash(null);
  }

  async function generateLabel() {
    setFlash(null);
    if (!draftTag) return;
    try {
      const tag = logging && initialTag ? logReplacement(initialTag, draftTag) : draftTag;
      const url = buildTagUrl(siteUrl, tag);
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 900, margin: 4, color: { dark: "#171713", light: "#ffffff" } });
      const saved = saveShelfTag(tag, encodeTag(tag));
      setGenerated({ tag, url, qr });
      if (!saved.ok) {
        setFlash({
          tone: "error",
          text: saved.reason === "quota"
            ? "CycleTag ready, but this browser’s local list is full. Print or copy the link — nothing was uploaded."
            : "CycleTag ready, but this browser blocked a local list (private mode or storage). Print or copy the link to keep it."
        });
        return;
      }
      setFlash({
        tone: "success",
        text: reissuing
          ? "New label ready and saved on this device. Print it and cover the old sticker — that QR still has the previous details."
          : reprinting
            ? "Label ready to print. It stays on this device only — CycleTag does not upload your list."
            : "CycleTag ready and saved on this device. Print, download the PNG, copy the link or add a calendar reminder."
      });
    } catch (error) {
      setFlash({ tone: "error", text: error instanceof Error ? error.message : "That tag could not be created. Check the fields and try again." });
    }
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    await generateLabel();
  }

  async function copyLink() {
    if (!generated) return;
    try {
      await copyText(generated.url);
      setFlash({ tone: "success", text: "Tag link copied. Anyone with this link can read the encoded item, search and date." });
    } catch {
      setFlash({ tone: "error", text: "Copy failed. Open the tag and copy its address from the browser." });
    }
  }

  function downloadQr() {
    if (!generated) return;
    triggerDownload(generated.qr, `${slug(generated.tag.n)}-cycletag.png`);
    setFlash({ tone: "success", text: "Label PNG downloaded. Import it into a printer app or attach it as a sticker." });
  }

  function downloadCalendar() {
    if (!generated) return;
    const blob = new Blob([createIcs(generated.tag, generated.url)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, `${slug(generated.tag.n)}-reorder.ics`);
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
    setFlash({ tone: "success", text: "Calendar reminder downloaded. Open the .ics file to add the repeating event." });
  }

  function printLabel() {
    window.print();
    setFlash({ tone: "success", text: "Print dialog opened. Cut around the dashed border and stick the label." });
  }

  const toast = flash ? <ActionToast message={flash.text} tone={flash.tone} /> : null;

  return (
    <section className="builder" id="create" aria-labelledby="builder-title">
      <div className="builder-intro">
        <div>
          <div className="section-kicker">{reprinting ? "SAVED ON THIS DEVICE" : reissuing ? "RE-ISSUE A LABEL" : "BUILD YOUR TAG"}</div>
          <h2 id="builder-title">{logging ? "Log a replacement" : builderTitle}</h2>
        </div>
        <p>{description}</p>
      </div>

      {reissuing && (
        <aside className="reissue-banner" aria-labelledby="reissue-title">
          <strong id="reissue-title">This creates a new QR, not an update.</strong>
          <p>
            CycleTag keeps every payload inside the label itself, so an already-printed sticker cannot be changed. Cover or discard the old one after you print this replacement; scanning the old QR still opens the previous part number.
          </p>
        </aside>
      )}

      {showPresets && !initialTag && (
        <div className="preset-grid">
          {presets.map((preset) => {
            const Icon = presetIcons[preset.icon];
            return (
              <button type="button" className="preset" key={preset.name} onClick={() => choosePreset(preset)}>
                <Icon aria-hidden="true" />
                <strong>{preset.name}</strong>
                <small>every {preset.interval} days</small>
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={generate} className="tag-form">
        <div className="field wide">
          <label htmlFor="name">Exact item / part name</label>
          <input id="name" value={name} onChange={(event) => { setName(event.target.value); invalidate(); }} maxLength={80} placeholder="e.g. Office printer toner" required />
        </div>
        <div className="field wide">
          <label htmlFor="part">Part number (optional)</label>
          <input id="part" value={part} maxLength={60} onChange={event => { setPart(event.target.value); invalidate(); }} placeholder="e.g. DLSC002" />
        </div>
        <div className="field wide">
          <label htmlFor="photo">Photo fingerprint (optional)</label>
          <input id="photo" type="file" accept="image/*" onChange={async event => {
            const file = event.target.files?.[0];
            const request = ++photoRequest.current;
            setPhoto(""); invalidate();
            if (!file) { setHashing(false); return; }
            setHashing(true);
            try { const digest = await hashPhoto(file); if (request === photoRequest.current) setPhoto(digest); }
            catch (error) { if (request === photoRequest.current) setFlash({ tone: "error", text: error instanceof Error ? error.message : "Photo hashing unavailable in this browser." }); }
            finally { if (request === photoRequest.current) setHashing(false); }
          }} />
          <small>{hashing ? "Hashing locally…" : "Only a SHA-256 fingerprint is saved. The photo never leaves your device. Keep the original yourself."}</small>
          {photo && <><code className="care-hash">{photo}</code><button type="button" className="secondary-button" onClick={() => { ++photoRequest.current; setPhoto(""); setHashing(false); invalidate(); }}>Remove fingerprint</button></>}
        </div>
        <div className="field">
          <label htmlFor="interval">Care interval</label>
          <div className="suffix-input"><input id="interval" type="number" min="1" max="730" value={interval} onChange={(event) => { setInterval(Number(event.target.value)); invalidate(); }} required /><span>days</span></div>
        </div>
        <div className="field">
          <label htmlFor="start">Last replaced</label>
          <input id="start" type="date" value={start} onChange={(event) => { setStart(event.target.value); invalidate(); }} required />
        </div>
        <details className="wide care-advanced"><summary>Optional marketplace & category</summary>
        <label><input type="checkbox" checked={marketplace} onChange={event => { setMarketplace(event.target.checked); invalidate(); }} /> Include a Find replacement button</label>
        <div className="field wide">
          <label htmlFor="query">Optional marketplace search</label>
          <input id="query" value={query} onChange={(event) => { setQuery(event.target.value); invalidate(); }} maxLength={160} placeholder="e.g. Brother TN-3480 black toner" aria-describedby="query-help" />
          <small id="query-help">Use a model or part number for the best result. Typo? Fix it here and create a new label.</small>
        </div>
        <div className="field">
          <label htmlFor="market">Shopping region</label>
          <select id="market" value={market} onChange={(event) => { setMarket(event.target.value as Market); invalidate(); }} aria-describedby="market-help">
            {markets.map((code) => <option key={code} value={code}>{marketChoiceLabel(code)}</option>)}
          </select>
          <small id="market-help">{marketDestinationNote(market)}</small>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(event) => { setCategory(event.target.value as TagCategory); invalidate(); }}>
            {categories.map((value) => <option key={value} value={value}>{title(value)}</option>)}
          </select>
        </div>
        </details>
        <aside className="encode-preview wide" aria-labelledby="encode-preview-title">
          <div className="section-kicker" id="encode-preview-title">ENCODED IN THE QR AND LINK</div>
          <dl className="encode-preview-list">
            <div><dt>Item</dt><dd>{name.trim() || "Not set yet"}</dd></div>
            <div><dt>Part #</dt><dd>{part || "Not provided"}</dd></div>
            <div><dt>Photo SHA-256</dt><dd className="care-hash">{photo || "Not provided"}</dd></div>
            <div><dt>Next due</dt><dd>{draftUrl && draftTag ? careDue(draftTag) : "Check dates"}</dd></div>
            <div><dt>History</dt><dd>{(initialTag?.care?.history.length ?? 0) + (logging ? 1 : 0)} previous entries; saved in the new QR</dd></div>
            <div><dt>Cycle</dt><dd>Every {interval || "—"} days from {start || "—"}</dd></div>
            <div><dt>Marketplace</dt><dd>{marketplace ? `${marketplaceName(market)} · ${query || name}` : "Not enabled"}</dd></div>
            <div><dt>Encoded search</dt><dd>{draftTag?.q || "Not set"}</dd></div>
          </dl>
          {draftUrl && draftTag && <details><summary>Preview all encoded care entries</summary><CareTimeline tag={logging && initialTag ? logReplacement(initialTag, draftTag) : draftTag} /></details>}
          {draftUrl ? (
            <p className="encode-preview-link">
              <span>Share link preview</span>
              <code>{draftUrl}</code>
            </p>
          ) : (
            <p className="encode-preview-link"><span>Share link preview</span> Add valid care details to see the public URL before you create the QR.</p>
          )}
          <p className="payload-warning">
            <ShieldCheck aria-hidden="true" size={14} />
            Anyone with this QR or link can read all care entries, part numbers, dates, photo hashes and marketplace details. Do not encode personal or confidential details. CycleTag still stores nothing — the payload lives in the URL by design.
          </p>
        </aside>
        {instantBuyUrl && marketplace && (
          <aside className="instant-buy wide" aria-labelledby="instant-buy-title">
            <div>
              <div className="section-kicker">OPTIONAL REPLACEMENT SEARCH</div>
              <h3 id="instant-buy-title">Need the replacement now?</h3>
              <p>Search eBay for the exact item now, then print the CycleTag so you never have to remember it again.</p>
              <small>Affiliate link: CycleTag may earn a commission, at no extra cost to you.</small>
            </div>
            <a className="buy-button" href={instantBuyUrl} target="_blank" rel="nofollow sponsored noopener">
              Find replacement now <ArrowRight aria-hidden="true" size={18} />
            </a>
          </aside>
        )}
        {draftError && <p className="wide" role="alert">{draftError}</p>}
        <button className="primary-button wide" type="submit" disabled={!canGenerate || !draftUrl}>
          {logging ? "Save care entry & create new QR" : reissuing ? "Create new label" : "Create care tag"} <ArrowRight aria-hidden="true" size={18} />
        </button>
        <p className="form-trust wide"><CheckCircle2 aria-hidden="true" size={14} /> Generated entirely in your browser. Nothing is uploaded.</p>
      </form>

      {!generated && toast}

      {generated && (
        <div className="result" ref={resultRef}>
          <div className="label-preview printable">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generated.qr} alt={`QR code for ${generated.tag.n}`} />
            <div>
              <span>SCAN FOR CARE HISTORY</span>
              <strong>{generated.tag.n}</strong>
              <small>{generated.tag.care?.part && `Part ${generated.tag.care.part} · `}Last replaced {generated.tag.s} · Next due {careDue(generated.tag)} · cycletag.eu</small>
            </div>
          </div>
          <div className="result-actions">
            <div>
              <div className="section-kicker">{reprinting ? "SAVED LABEL READY" : reissuing ? "REPLACEMENT LABEL READY" : "YOUR TAG IS READY"}</div>
              <h3>Keep the care with the machine.</h3>
              <p>
                The QR opens this care snapshot. Anyone with the sticker or link can read its encoded fields. Recorded entries are self-reported, not independently verified.
              </p>
            </div>
            {toast}
            <div className="share-preview">
              <span>Public tag link</span>
              <code>{generated.url}</code>
            </div>
            <p className="payload-warning">
              <ShieldCheck aria-hidden="true" size={14} />
              Print, download, copy or share only if you are happy for this payload to be public. CycleTag has no account that could hide it later. A copy can also sit in My tags on this device — that list is not uploaded.
            </p>
            <div className="button-grid">
              <button type="button" className="primary-button" onClick={printLabel}>Print on A4</button>
              <Link className="secondary-button" href={`/care-sheet#d=${encodeTag(generated.tag)}`}>12-up Care Sheet / PDF</Link>
              <a className="secondary-button" href={generated.url}>Open care history</a>
              <button type="button" className="secondary-button" onClick={downloadQr}>Download PNG</button>
              <button type="button" className="secondary-button" onClick={downloadCalendar}>Add reminder</button>
              <button type="button" className="secondary-button" onClick={copyLink}>Copy link</button>
            </div>
            <p className="reissue-hint">
              {reissuing
                ? "Cover or discard the previous sticker. Scanning it still opens the old part number because CycleTag cannot rewrite a printed QR."
                : "Typo in the part number? Change the fields above and create a new QR. Already-printed labels keep whatever was encoded in them."}
              {" "}
              <Link href="/#tags">View My tags on this device</Link>
            </p>
            <div className="print-help">
              <strong>No special printer required.</strong>
              <p>Use any home or office printer, cut around the border and attach with clear tape or sticker paper. For a mini label printer, download the PNG and import it into the printer app.</p>
              <a href={printerUrl} target="_blank" rel="sponsored nofollow noopener">Browse optional 50 mm label printers <ArrowRight aria-hidden="true" size={15} /></a>
              <small>Affiliate link: CycleTag may earn a commission, at no extra cost to you.</small>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50) || "item";
}

function title(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
