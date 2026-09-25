"use client";

import { useMarket } from "@/lib/use-market";
import { measure } from "@/lib/measure-client";
import QRCode from "qrcode";
import { FormEvent, useState } from "react";
import { marketChoiceLabel } from "@/lib/affiliate";
import { siteUrl } from "@/lib/site";
import { buildTagUrl, categories, markets, type Market, type TagCategory, type TagPayload } from "@/lib/tag";

type BulkLabel = { tag: TagPayload; url: string; qr: string };

type Flash = { tone: "success" | "error"; text: string };

const example = `Printer toner, Brother TN-3480 black toner, 90
Coffee filter, DeLonghi DLSC002 water filter, 60
Vacuum bags, Miele GN HyClean vacuum bags, 90`;

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function BulkGenerator() {
  const [raw, setRaw] = useState(example);
  const { market, chooseMarket, lockMarket } = useMarket();
  const [category, setCategory] = useState<TagCategory>("office");
  const [labels, setLabels] = useState<BulkLabel[]>([]);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    lockMarket();
    setBusy(true);
    setFlash(null);
    try {
      const rows = parseRows(raw, market, category).slice(0, 50);
      if (rows.length === 0) {
        setLabels([]);
        setFlash({ tone: "error", text: "Add at least one row with a name and search phrase." });
        return;
      }

      const nextLabels = await Promise.all(rows.map(async (tag) => {
        const url = buildTagUrl(siteUrl, tag);
        const qr = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", width: 420, margin: 4, color: { dark: "#171713", light: "#ffffff" } });
        return { tag, url, qr };
      }));

      setLabels(nextLabels);
      measure("label_created", "bulk");
      setFlash({ tone: "success", text: `${nextLabels.length} labels ready. Print this page on A4 and cut the labels.` });
    } catch {
      setFlash({ tone: "error", text: "The bulk sheet could not be created. Check the rows and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bulk-builder" data-tag-builder aria-labelledby="bulk-builder-title">
      <div className="builder-intro">
        <div>
          <div className="section-kicker">BULK SHEET</div>
          <h2 id="bulk-builder-title">Paste up to 50 replacements.</h2>
        </div>
        <p>Use one row per item: label name, exact search phrase, replacement interval in days. Everything is generated in your browser.</p>
      </div>

      <form className="tag-form" onSubmit={generate}>
        <div className="field wide">
          <label htmlFor="bulk-rows">Rows</label>
          <textarea id="bulk-rows" value={raw} onChange={(event) => setRaw(event.target.value)} rows={9} />
          <small>Format: name, exact reorder search, days. Maximum 50 labels per batch, printed across A4 pages.</small>
        </div>
        <div className="field">
          <label htmlFor="bulk-market">Shopping region</label>
          <select id="bulk-market" value={market} onChange={(event) => chooseMarket(event.target.value as Market)}>
            {markets.map((code) => <option key={code} value={code}>{marketChoiceLabel(code)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="bulk-category">Default category</label>
          <select id="bulk-category" value={category} onChange={(event) => setCategory(event.target.value as TagCategory)}>
            {categories.map((value) => <option key={value} value={value}>{value.charAt(0).toUpperCase() + value.slice(1)}</option>)}
          </select>
        </div>
        <button className="primary-button wide" type="submit" disabled={busy}>{busy ? "Building sheet…" : "Build bulk sheet"}</button>
      </form>

      {flash && <p className={`bulk-flash ${flash.tone === "error" ? "bulk-flash-error" : ""}`}>{flash.text}</p>}

      {labels.length > 0 && (
        <div className="bulk-output">
          <div className="bulk-actions no-print">
            <div>
              <div className="section-kicker">PRINT READY</div>
              <h2>{labels.length} StayTags</h2>
            </div>
            <button className="primary-button" type="button" onClick={() => window.print()}>Print A4 sheet</button>
          </div>
          <div className="bulk-sheet printable">
            {labels.map((label) => (
              <article className="bulk-label" key={label.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={label.qr} alt={`QR code for ${label.tag.n}`} />
                <div>
                  <span>SCAN TO REORDER</span>
                  <strong>{label.tag.n}</strong>
                  <small>{label.tag.q}</small>
                  <em>Every {label.tag.i} days · cycletag.eu</em>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function parseRows(raw: string, market: Market, category: TagCategory): TagPayload[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", query = "", interval = "90"] = line.split(/\t|,/).map((part) => part.trim());
      const days = Number.parseInt(interval, 10);
      return {
        v: 1,
        n: name.slice(0, 80),
        q: query.slice(0, 160),
        c: category,
        i: Number.isFinite(days) && days >= 1 && days <= 730 ? days : 90,
        s: today(),
        m: market
      } satisfies TagPayload;
    })
    .filter((tag) => tag.n.length > 0 && tag.q.length > 0);
}

