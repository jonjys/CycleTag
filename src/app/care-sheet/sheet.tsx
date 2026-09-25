"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { buildTagUrl, decodeTag, encodeTag, type TagPayload } from "@/lib/tag";
import { careDue } from "@/lib/care";
import { getShelfSnapshot, getServerShelfSnapshot, subscribeShelf } from "@/lib/shelf";
import { siteUrl } from "@/lib/site";

export function CareSheet() {
  const shelf = useSyncExternalStore(subscribeShelf, getShelfSnapshot, getServerShelfSnapshot);
  const [selected, setSelected] = useState<string[]>([]);
  const [prepared, setPrepared] = useState<{ selection: string[]; rows: { tag: TagPayload; qr: string }[]; error: string }>({ selection: [], rows: [], error: "" });
  const busy = prepared.selection !== selected;
  const rows = busy ? [] : prepared.rows;
  const error = busy ? "" : prepared.error;
  useEffect(() => {
    const read = () => { const tag = decodeTag(new URLSearchParams(location.hash.slice(1)).get("d")); if (tag) setSelected([encodeTag(tag)]); };
    read(); window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all(selected.map(async encoded => {
      const tag = decodeTag(encoded);
      if (!tag) throw new Error("A saved tag is unreadable. Remove it and select another.");
      const qr = await QRCode.toDataURL(buildTagUrl(siteUrl, tag), { width: 900, margin: 4, errorCorrectionLevel: "M" });
      return { tag, qr };
    })).then(result => { if (active) setPrepared({ selection: selected, rows: result, error: "" }); }).catch(e => { if (active) setPrepared({ selection: selected, rows: [], error: e.message }); });
    return () => { active = false; };
  }, [selected]);
  return <>
    <section className="no-print care-sheet-controls">
      <div className="section-kicker">NYTTO LABS / FREE PRINTABLE SHEET</div><h1>Care Sheet</h1>
      <p>12 QR labels and a care schedule. Free to print or save as PDF. You provide the paper and printer.</p>
      <p>Choose up to 12 snapshots. One selected tag fills all 12 cells with copies; multiple tags fill one cell each. Use A4 at 100% scale, turn off browser headers and footers, then print or choose Save as PDF. The second page is your duration schedule.</p>
      {shelf.length > 0 && <fieldset><legend>Tags on this device</legend>{shelf.map(record => <label key={record.encoded} className="care-sheet-choice"><input type="checkbox" checked={selected.includes(record.encoded)} disabled={!selected.includes(record.encoded) && selected.length >= 12} onChange={e => setSelected(e.target.checked ? [...selected, record.encoded] : selected.filter(value => value !== record.encoded))} />{record.name} · {record.lastReplaced}</label>)}</fieldset>}
      <p>Anyone with a printed QR can read its encoded fields. Records are self-reported; no photo is uploaded.</p>
      {error && <p role="alert">{error}</p>}
      <button className="primary-button" disabled={busy || !rows.length || Boolean(error)} onClick={() => window.print()}>{busy ? "Preparing QR codes…" : "Print 12-up sheet + duration PDF"}</button>{" "}<Link href="/#create">Create a care tag</Link>
      <button className="secondary-button" onClick={() => setSelected([])}>Clear selection</button>
    </section>
    {rows.length > 0 && <div className="care-print-root">
      <section className="care-grid" aria-label="12-up care label sheet">{Array.from({ length: 12 }, (_, index) => {
        const row = rows.length === 1 ? rows[0] : rows[index];
        return <article className="care-cell" key={index}>{row ? <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.qr} alt={`Care QR for ${row.tag.n}`} /><strong>{row.tag.n}</strong><span>{row.tag.care?.part || "Care snapshot"}</span><small>Last {row.tag.s}<br />Due {careDue(row.tag)} · {row.tag.i} days<br />cycletag.eu</small>
        </> : <span>Unused label</span>}</article>;
      })}</section>
      <section className="care-duration"><h2>Care duration schedule</h2><p>StayTag · Nytto Labs · Self-reported snapshots. Dates do not confirm completed maintenance.</p>
        <table><thead><tr><th>Item / part</th><th>Last replaced</th><th>Interval</th><th>Next due</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index}><td>{row.tag.n}<br />{row.tag.care?.part}</td><td>{row.tag.s}</td><td>{row.tag.i} days</td><td>{careDue(row.tag)}</td></tr>)}</tbody></table>
        <p>Old stickers stay unchanged. Log each replacement and print a new QR. A photo fingerprint does not certify care or prove a date.</p>
      </section>
    </div>}
  </>;
}

