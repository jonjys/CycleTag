"use client";

import QRCode from "qrcode";
import { ArrowRight, CheckCircle2, Coffee, Droplets, PawPrint, Printer, Wrench, Wind, type LucideIcon } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { marketConfig } from "@/lib/affiliate";
import { copyText } from "@/lib/clipboard";
import { triggerDownload } from "@/lib/download";
import { createIcs } from "@/lib/ics";
import { presets, type Preset } from "@/lib/presets";
import { buildTagUrl, categories, markets, type Market, type TagCategory, type TagPayload } from "@/lib/tag";

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

type Generated = { tag: TagPayload; url: string; qr: string };

const presetIcons: Record<Preset["icon"], LucideIcon> = {
  printer: Printer,
  water: Droplets,
  coffee: Coffee,
  vacuum: Wind,
  pet: PawPrint,
  workshop: Wrench
};

export function Generator() {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TagCategory>("home");
  const [interval, setInterval] = useState(90);
  const [start, setStart] = useState(today);
  const [market, setMarket] = useState<Market>("DE");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [message, setMessage] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const canGenerate = useMemo(() => name.trim().length > 0 && query.trim().length > 0 && interval >= 1 && interval <= 730 && start.length > 0, [name, query, interval, start]);

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
    setMessage("");
  }

  function invalidate() {
    setGenerated(null);
    setMessage("");
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!canGenerate) return;
    const tag: TagPayload = { v: 1, n: name.trim(), q: query.trim(), c: category, i: interval, s: start, m: market };
    try {
      const url = buildTagUrl(window.location.origin, tag);
      const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 720, margin: 2, color: { dark: "#171713", light: "#ffffff" } });
      setGenerated({ tag, url, qr });
    } catch {
      setMessage("That tag could not be created. Check the fields and try again.");
    }
  }

  async function copyLink() {
    if (!generated) return;
    try {
      await copyText(generated.url);
      setMessage("Tag link copied.");
    } catch {
      setMessage("Copy failed. Open the tag and copy its address from the browser.");
    }
  }

  function downloadQr() {
    if (!generated) return;
    triggerDownload(generated.qr, `${slug(generated.tag.n)}-cycletag.png`);
  }

  function downloadCalendar() {
    if (!generated) return;
    const blob = new Blob([createIcs(generated.tag, generated.url)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    triggerDownload(href, `${slug(generated.tag.n)}-reorder.ics`);
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
  }

  return (
    <section className="builder" aria-labelledby="builder-title">
      <div className="builder-intro">
        <div className="section-kicker">BUILD YOUR TAG</div>
        <h2 id="builder-title">What keeps running out?</h2>
        <p>Start with a common replacement or make your own.</p>
      </div>

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

      <form onSubmit={generate} className="tag-form">
        <div className="field wide">
          <label htmlFor="name">Label name</label>
          <input id="name" value={name} onChange={(event) => { setName(event.target.value); invalidate(); }} maxLength={80} placeholder="e.g. Office printer toner" required />
        </div>
        <div className="field wide">
          <label htmlFor="query">Exact reorder search</label>
          <input id="query" value={query} onChange={(event) => { setQuery(event.target.value); invalidate(); }} maxLength={160} placeholder="e.g. Brother TN-3480 black toner" required aria-describedby="query-help" />
          <small id="query-help">Use a model or part number for the best result.</small>
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
          <label htmlFor="market">Shopping market</label>
          <select id="market" value={market} onChange={(event) => { setMarket(event.target.value as Market); invalidate(); }}>
            {markets.map((code) => <option key={code} value={code}>{marketConfig[code].label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(event) => { setCategory(event.target.value as TagCategory); invalidate(); }}>
            {categories.map((value) => <option key={value} value={value}>{title(value)}</option>)}
          </select>
        </div>
        <button className="primary-button wide" type="submit" disabled={!canGenerate}>Create CycleTag <ArrowRight aria-hidden="true" size={18} /></button>
        <p className="form-trust wide"><CheckCircle2 aria-hidden="true" size={14} /> Generated entirely in your browser. Nothing is uploaded.</p>
      </form>

      {message && <div className="toast" role="status">{message}</div>}

      {generated && (
        <div className="result" ref={resultRef}>
          <div className="label-preview printable">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generated.qr} alt={`QR code for ${generated.tag.n}`} />
            <div><span>SCAN TO REORDER</span><strong>{generated.tag.n}</strong><small>Every {generated.tag.i} days · cycletag</small></div>
          </div>
          <div className="result-actions">
            <div><div className="section-kicker">YOUR TAG IS READY</div><h3>Print it. Stick it. Forget it.</h3><p>The QR contains the instructions. It stays useful even without an account.</p></div>
            <div className="button-grid">
              <button type="button" className="primary-button" onClick={() => window.print()}>Print label</button>
              <button type="button" className="secondary-button" onClick={downloadQr}>Download PNG</button>
              <button type="button" className="secondary-button" onClick={downloadCalendar}>Add reminder</button>
              <button type="button" className="secondary-button" onClick={copyLink}>Copy link</button>
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
