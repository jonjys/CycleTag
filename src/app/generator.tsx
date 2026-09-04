"use client";

import QRCode from "qrcode";
import { ArrowRight, CheckCircle2, Coffee, Droplets, PawPrint, Printer, ShieldCheck, Wrench, Wind, type LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ActionToast, type ToastTone } from "./action-toast";
import {
  buildEbayLink,
  defaultCampaignId,
  marketChoiceLabel,
  marketConfig,
  marketDestinationNote,
  marketplaceName
} from "@/lib/affiliate";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { presets, type Preset } from "@/lib/presets";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, categories, markets, type Market, type TagCategory, type TagPayload } from "@/lib/tag";

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
  showPresets?: boolean;
  title?: string;
  description?: string;
};

export function Generator({
  initialPreset,
  initialTag,
  reissuing = false,
  showPresets = true,
  title: builderTitle = reissuing ? "Correct this tag" : "What keeps running out?",
  description = reissuing
    ? "Fix the name or part number, then create a new QR. The old sticker is unchanged."
    : "Start with a common replacement or make your own."
}: GeneratorProps = {}) {
  const [name, setName] = useState(initialTag?.n ?? initialPreset?.name ?? "");
  const [query, setQuery] = useState(initialTag?.q ?? initialPreset?.query ?? "");
  const [category, setCategory] = useState<TagCategory>(initialTag?.c ?? initialPreset?.category ?? "home");
  const [interval, setInterval] = useState(initialTag?.i ?? initialPreset?.interval ?? 90);
  const [start, setStart] = useState(initialTag?.s ?? today);
  const [market, setMarket] = useState<Market>(initialTag?.m ?? "DE");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const canGenerate = name.trim().length > 0 && query.trim().length > 0 && interval >= 1 && interval <= 730 && start.length > 0;
  const draftUrl = useMemo(() => {
    if (!canGenerate) return "";
    try {
      return buildTagUrl(siteUrl, {
        v: 1,
        n: name.trim(),
        q: query.trim(),
        c: category,
        i: interval,
        s: start,
        m: market
      });
    } catch {
      return "";
    }
  }, [canGenerate, name, query, category, interval, start, market]);
  const printerUrl = generated
    ? buildEbayLink(
        { ...generated.tag, q: "50mm Bluetooth thermal label printer QR code", c: "office" },
        defaultCampaignId
      )
    : "";

  useEffect(() => {
    if (generated) {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      resultRef.current?.scrollIntoView({ behavior, block: "start" });
    }
  }, [generated]);

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

  async function generate(event: FormEvent) {
    event.preventDefault();
    setFlash(null);
    if (!canGenerate) return;
    const tag: TagPayload = { v: 1, n: name.trim(), q: query.trim(), c: category, i: interval, s: start, m: market };
    try {
      const url = buildTagUrl(siteUrl, tag);
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 720, margin: 2, color: { dark: "#171713", light: "#ffffff" } });
      setGenerated({ tag, url, qr });
      setFlash({
        tone: "success",
        text: reissuing
          ? "New label ready. Print or download it and cover the old sticker — that QR still has the previous details."
          : "CycleTag ready. Print, download the PNG, copy the link or add a calendar reminder."
      });
    } catch {
      setFlash({ tone: "error", text: "That tag could not be created. Check the fields and try again." });
    }
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
          <div className="section-kicker">{reissuing ? "RE-ISSUE A LABEL" : "BUILD YOUR TAG"}</div>
          <h2 id="builder-title">{builderTitle}</h2>
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

      {showPresets && (
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
          <label htmlFor="name">Label name</label>
          <input id="name" value={name} onChange={(event) => { setName(event.target.value); invalidate(); }} maxLength={80} placeholder="e.g. Office printer toner" required />
        </div>
        <div className="field wide">
          <label htmlFor="query">Exact reorder search</label>
          <input id="query" value={query} onChange={(event) => { setQuery(event.target.value); invalidate(); }} maxLength={160} placeholder="e.g. Brother TN-3480 black toner" required aria-describedby="query-help" />
          <small id="query-help">Use a model or part number for the best result. Typo? Fix it here and create a new label.</small>
        </div>
        <div className="field">
          <label htmlFor="interval">Replace every</label>
          <div className="suffix-input"><input id="interval" type="number" min="1" max="730" value={interval} onChange={(event) => { setInterval(Number(event.target.value)); invalidate(); }} required /><span>days</span></div>
        </div>
        <div className="field">
          <label htmlFor="start">Last replaced</label>
          <input id="start" type="date" value={start} onChange={(event) => { setStart(event.target.value); invalidate(); }} required />
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
        <aside className="encode-preview wide" aria-labelledby="encode-preview-title">
          <div className="section-kicker" id="encode-preview-title">ENCODED IN THE QR AND LINK</div>
          <dl className="encode-preview-list">
            <div><dt>Item</dt><dd>{name.trim() || "Not set yet"}</dd></div>
            <div><dt>Search</dt><dd>{query.trim() || "Not set yet"}</dd></div>
            <div><dt>Cycle</dt><dd>Every {interval || "—"} days from {start || "—"}</dd></div>
            <div><dt>Opens</dt><dd>{marketplaceName(market)}</dd></div>
          </dl>
          {draftUrl ? (
            <p className="encode-preview-link">
              <span>Share link preview</span>
              <code>{draftUrl}</code>
            </p>
          ) : (
            <p className="encode-preview-link"><span>Share link preview</span> Add a name and search to see the public URL before you create the QR.</p>
          )}
          <p className="payload-warning">
            <ShieldCheck aria-hidden="true" size={14} />
            Anyone with this QR or link can read the item name, search, date and market. Do not encode personal or confidential details. CycleTag still stores nothing — the payload lives in the URL by design.
          </p>
        </aside>
        <button className="primary-button wide" type="submit" disabled={!canGenerate}>
          {reissuing ? "Create new label" : "Create CycleTag"} <ArrowRight aria-hidden="true" size={18} />
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
              <span>SCAN TO REORDER</span>
              <strong>{generated.tag.n}</strong>
              <small>Every {generated.tag.i} days · {marketplaceName(generated.tag.m)} · cycletag.eu</small>
            </div>
          </div>
          <div className="result-actions">
            <div>
              <div className="section-kicker">{reissuing ? "REPLACEMENT LABEL READY" : "YOUR TAG IS READY"}</div>
              <h3>Print it. Stick it. Forget it.</h3>
              <p>
                The QR opens {marketplaceName(generated.tag.m)} for {marketConfig[generated.tag.m].label}. Anyone with the sticker or link can read the encoded item, search and date.
              </p>
            </div>
            {toast}
            <div className="share-preview">
              <span>Public tag link</span>
              <code>{generated.url}</code>
            </div>
            <p className="payload-warning">
              <ShieldCheck aria-hidden="true" size={14} />
              Print, download, copy or share only if you are happy for this payload to be public. CycleTag has no account that could hide it later.
            </p>
            <div className="button-grid">
              <button type="button" className="primary-button" onClick={printLabel}>Print on A4</button>
              <button type="button" className="secondary-button" onClick={downloadQr}>Download PNG</button>
              <button type="button" className="secondary-button" onClick={downloadCalendar}>Add reminder</button>
              <button type="button" className="secondary-button" onClick={copyLink}>Copy link</button>
            </div>
            <p className="reissue-hint">
              {reissuing
                ? "Cover or discard the previous sticker. Scanning it still opens the old part number because CycleTag cannot rewrite a printed QR."
                : "Typo in the part number? Change the fields above and create a new QR. Already-printed labels keep whatever was encoded in them."}
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
