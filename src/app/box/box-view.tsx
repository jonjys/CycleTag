"use client";

import Link from "next/link";
import { Check, Search } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/locale";
import { measure } from "@/lib/measure-client";
import { decodeBox, getMoveSnapshot, getServerSnapshot, parseMove, roomColors, subscribeMove, upsertBox, writeMove } from "@/lib/move";
import { roomName } from "@/app/move/move-planner";

const hashSnapshot = () => window.location.hash;
const hashServer = () => null;
function subscribeHash(callback: () => void) { window.addEventListener("hashchange", callback); return () => window.removeEventListener("hashchange", callback); }

export function BoxView() {
  const { t, locale } = useLocale();
  const hash = useSyncExternalStore(subscribeHash, hashSnapshot, hashServer);
  const raw = useSyncExternalStore(subscribeMove, getMoveSnapshot, getServerSnapshot);
  const [filter, setFilter] = useState("");
  const counted = useRef("");
  const encoded = hash === null ? null : new URLSearchParams(hash.slice(1)).get("d");
  const label = hash === null ? undefined : decodeBox(encoded);

  useEffect(() => {
    if (!label || !encoded || counted.current === encoded) return;
    counted.current = encoded;
    measure("box_scanned", "box");
  }, [label, encoded]);

  if (label === undefined) return <p className="mv-loading" aria-live="polite">{t("Reading box…", "Läser kartongen…")}</p>;
  if (!label) return <section className="box-shell"><h1>{t("This box label cannot be read.", "Kartongetiketten kan inte läsas.")}</h1><p>{t("The QR may be damaged or incomplete.", "QR-koden kan vara skadad eller ofullständig.")}</p><Link className="primary-button" href="/move">{t("Label your own boxes", "Märk dina egna kartonger")}</Link></section>;

  const owned = raw ? parseMove(raw).move : null;
  const mine = owned?.boxes.find(box => box.n === label.n && (owned.name || "My move") === label.move);
  const q = filter.trim().toLowerCase();
  const items = q ? label.items.filter(item => item.toLowerCase().includes(q)) : label.items;
  const color = roomColors[label.room] ?? "#171713";

  return <section className="box-shell" style={{ ["--room" as string]: color }}>
    <div className="box-band">{roomName(label.room, locale).toUpperCase()}</div>
    <div className="box-body">
      <p className="box-move">{label.move}</p>
      <h1><span>{t("Box", "Kartong")}</span> #{label.n}</h1>
      {(label.fragile || label.heavy) && <p className="box-flags">{label.fragile && <span>{t("Fragile — handle with care", "Ömtåligt — hantera varsamt")}</span>}{label.heavy && <span>{t("Heavy — lift with two", "Tungt — lyft två")}</span>}</p>}
      {label.note && <p className="box-note">{label.note}</p>}
      <h2>{t(`Inside (${label.items.length})`, `Innehåll (${label.items.length})`)}</h2>
      {label.items.length > 8 && <label className="mv-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t("Filter items", "Filtrera")}</span><input type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder={t("Looking for…", "Letar efter…")} /></label>}
      {label.items.length ? <ul className="box-items">{items.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p>{t("No contents were listed for this box.", "Inget innehåll angavs för kartongen.")}</p>}
      {mine && <button type="button" className={mine.unpacked ? "secondary-button" : "primary-button"} onClick={() => owned && writeMove(upsertBox(owned, { ...mine, unpacked: !mine.unpacked }))}><Check size={18} aria-hidden="true" /> {mine.unpacked ? t("Unpacked ✓ (tap to undo)", "Uppackad ✓ (tryck för att ångra)") : t("Mark as unpacked", "Markera som uppackad")}</button>}
      <p className="mv-fine">{t("The contents list is stored in this QR code itself. No account, no database, no owner details.", "Innehållslistan finns i själva QR-koden. Inget konto, ingen databas, inga ägaruppgifter.")}</p>
    </div>
    <aside className="box-cta" aria-label={t("Make labels like this", "Gör egna etiketter")}><strong>{t("Helping someone move? When it's your turn, make labels like this.", "Hjälper du någon att flytta? När det är din tur kan du göra likadana etiketter.")}</strong> <span>{t("Scan a box, see what's inside. No app, no account.", "Skanna kartongen, se vad som finns i den. Ingen app, inget konto.")}</span> <Link className="primary-button" href="/">{t("Label your first 3 boxes free →", "Märk dina första 3 kartonger gratis →")}</Link></aside>
  </section>;
}
