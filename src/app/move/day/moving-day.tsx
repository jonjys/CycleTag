"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Home, Printer, RefreshCw, RotateCcw, ShieldCheck, Truck, Users, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale";
import { measure } from "@/lib/measure-client";
import { roomColors, roomsSv } from "@/lib/move";
import { getShareSnapshot, newShareKey, parseShare, saveShare, sharedProgress, sharedRequest, shareFromHash, shareKeyId, sharePath, type BoxState, type ShareCredentials, type SharedBox, type SharedMove } from "@/lib/shared-move";

type Editor = { box: SharedBox; draft: string; conflict: boolean };
type T = (en: string, sv: string) => string;

export function MovingDay() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [credentials, setCredentials] = useState<ShareCredentials | null>(null);
  const [move, setMove] = useState<SharedMove | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);
  const [updated, setUpdated] = useState("");
  const [error, setError] = useState("");
  const [gone, setGone] = useState(false);
  const [stage, setStage] = useState<"loading" | "delivery">("loading");
  const [filter, setFilter] = useState<"all" | "remaining" | "notes">("all");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [helper, setHelper] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const sequence = useRef(0), writing = useRef(false), reading = useRef(false);
  const noteDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = noteDialog.current;
    if (editor && dialog && !dialog.open) { dialog.showModal(); dialog.querySelector("textarea")?.focus(); }
    if (!editor && dialog?.open) dialog.close();
  }, [editor]);

  const read = useCallback(async (auth: ShareCredentials, silent = false) => {
    if (writing.current || reading.current) return;
    reading.current = true;
    const seq = ++sequence.current;
    try {
      const result = await sharedRequest({ action: "read", id: auth.id, key: auth.key });
      if (seq !== sequence.current) return;
      if (result.status === "ok" && result.move) {
        setMove(result.move); setGone(false); setError(""); setOnline(true);
        setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        if (result.move.role === "owner") {
          const stored = parseShare(getShareSnapshot());
          const own = stored?.id === auth.id && stored.key === auth.key ? stored : auth;
          const confirmedHelper = own.helper && await shareKeyId(own.helper) === result.move.helperKeyId ? own.helper : null;
          if (seq !== sequence.current) return;
          setHelper(confirmedHelper);
          if (!saveShare({ ...own, expiresAt: result.move.expiresAt })) setStorageWarning(true);
        }
      } else if (result.status === "not_found" || result.status === "forbidden") {
        setGone(true); setMove(null); setError(t("This link has expired, was deleted or has been replaced. Ask the person organising the move for their current helper link.", "Länken har löpt ut, raderats eller ersatts. Be den som ordnar flytten om den aktuella hjälparlänken."));
      } else setError(t("Could not refresh. The checks below may be out of date. Retry before changing anything.", "Kunde inte uppdatera. Avprickningarna nedan kan vara gamla. Försök igen innan du ändrar något."));
    } catch {
      if (seq === sequence.current) { setOnline(false); setError(t("Connection lost. The last confirmed checks are shown. Nothing is queued or saved offline; reconnect and retry.", "Anslutningen bröts. Senast bekräftade avprickningar visas. Inget köas eller sparas offline; anslut och försök igen.")); }
    } finally { reading.current = false; if (seq === sequence.current && !silent) setLoading(false); }
  }, [t]);
  // Keep the polling callback current without restarting the interval on each render.
  const readRef = useRef(read);
  useEffect(() => { readRef.current = read; }, [read]);

  useEffect(() => {
    const auth = shareFromHash(location.hash);
    if (!auth) {
      queueMicrotask(() => { setLoading(false); setGone(true); setError(t("Open the complete private moving-day link, including the part after #.", "Öppna hela den privata flyttdagslänken, inklusive delen efter #.")); });
      return;
    }
    queueMicrotask(() => { setCredentials(auth); void readRef.current(auth); });
    const poll = () => { if (document.visibilityState === "visible" && navigator.onLine) void readRef.current(auth, true); };
    const offline = () => { setOnline(false); setError(t("You are offline. These are the last confirmed checks. Reconnect before making changes.", "Du är offline. Här visas senast bekräftade avprickningar. Anslut innan du gör ändringar.")); };
    const reconnected = () => { setOnline(true); poll(); };
    const interval = setInterval(poll, 8000);
    const requestSequence = sequence;
    document.addEventListener("visibilitychange", poll); window.addEventListener("online", reconnected); window.addEventListener("offline", offline);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", poll); window.removeEventListener("online", reconnected); window.removeEventListener("offline", offline); requestSequence.current++; };
    // The capability is read once per navigation; it is never sent in a URL or analytics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateBox(box: SharedBox, state: BoxState, note = box.note) {
    if (!credentials || writing.current || !online || error) return;
    writing.current = true; setBusy(true); ++sequence.current; setError("");
    let refresh = false;
    try {
      const result = await sharedRequest({ action: "update", ...credentials, n: box.n, revision: box.revision, state, note });
      if (result.status === "ok" && result.move) {
        setMove(result.move); setEditor(null);
        setUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        measure("move_day_checked", "move");
      } else if (result.status === "conflict") {
        setEditor(current => current ? { ...current, conflict: true } : current); refresh = true;
        setError(t(`Box ${box.n} was changed on another phone. Your change was not saved. The latest checks are being loaded.`, `Kartong ${box.n} ändrades i en annan mobil. Din ändring sparades inte. De senaste avprickningarna hämtas.`));
      } else if (result.status === "load_first") { setError(t("Check the box as loaded before marking it delivered.", "Pricka av kartongen som lastad innan du markerar den levererad.")); refresh = true; }
      else if (result.status === "not_found" || result.status === "forbidden") { setGone(true); setMove(null); setError(t("This link is no longer active. Ask for a new link.", "Länken är inte längre aktiv. Be om en ny länk.")); }
      else { setError(t("The change could not be confirmed. Refresh before retrying.", "Ändringen kunde inte bekräftas. Uppdatera innan du försöker igen.")); }
    } catch { setError(t("The connection broke during saving. Refresh to check what was saved before retrying.", "Anslutningen bröts under sparandet. Uppdatera och kontrollera vad som sparades innan du försöker igen.")); }
    finally { writing.current = false; setBusy(false); if (refresh) void readRef.current(credentials, true); }
  }

  async function rotate() {
    if (!credentials || writing.current || !move || move.role !== "owner") return;
    if (!window.confirm(t("Replace the helper link? The old link will stop working for everyone who has it.", "Ersätt hjälparlänken? Den gamla länken slutar fungera för alla som har den."))) return;
    const next = newShareKey();
    // Persist before the request, so a lost acknowledgement cannot lose the new key.
    if (!saveShare({ ...credentials, helper: next, expiresAt: move.expiresAt })) { setStorageWarning(true); return; }
    writing.current = true; setBusy(true); ++sequence.current;
    try {
      const result = await sharedRequest({ action: "rotate", ...credentials, helper: next });
      if (result.status === "ok" && result.move) { setHelper(next); setMove(result.move); setCopied(false); setError(""); }
      else { setHelper(null); setError(t("Could not confirm the new link. Refresh, then create a new helper link before sharing.", "Kunde inte bekräfta den nya länken. Uppdatera och skapa sedan en ny hjälparlänk innan du delar.")); }
    } catch { setHelper(null); setError(t("Connection lost. Refresh, then create a new helper link before sharing.", "Anslutningen bröts. Uppdatera och skapa sedan en ny hjälparlänk innan du delar.")); }
    finally { writing.current = false; setBusy(false); }
  }

  async function remove() {
    if (!credentials || writing.current || move?.role !== "owner") return;
    if (!window.confirm(t("Delete this shared move and all its checks and notes? Every helper link will stop working. Your local packing list is kept.", "Radera den delade flytten med alla avprickningar och anteckningar? Alla hjälparlänkar slutar fungera. Din lokala packlista finns kvar."))) return;
    writing.current = true; setBusy(true); ++sequence.current;
    try {
      const result = await sharedRequest({ action: "delete", ...credentials });
      if (result.status === "deleted" || result.status === "not_found") { const stored = parseShare(getShareSnapshot()); if (stored?.id === credentials.id) saveShare(null); router.push("/move"); }
      else setError(t("Deletion was not confirmed. Refresh and retry.", "Raderingen kunde inte bekräftas. Uppdatera och försök igen."));
    } catch { setError(t("Connection lost. Refresh to check whether the shared copy was deleted.", "Anslutningen bröts. Uppdatera för att kontrollera om den delade kopian raderades.")); }
    finally { writing.current = false; setBusy(false); }
  }

  if (loading) return <p className="mv-loading" role="status">{t("Opening moving day…", "Öppnar flyttdagen…")}</p>;
  if (!move) return <section className="md-unavailable"><h1>{t("Moving day", "Flyttdagen")}</h1><p role="alert">{error}</p>{credentials && !gone && <button type="button" className="primary-button" onClick={() => void readRef.current(credentials)}>{t("Try again", "Försök igen")}</button>}<Link className="secondary-button" href="/move">{t("Back to my packing list", "Tillbaka till min packlista")}</Link>{gone && credentials && <button type="button" className="secondary-button" onClick={() => { const stored = parseShare(getShareSnapshot()); if (stored?.id === credentials.id) saveShare(null); router.push("/move"); }}>{t("Forget this link on this device", "Glöm den här länken på enheten")}</button>}</section>;

  const progress = sharedProgress(move.boxes);
  const missing = stage === "loading" ? progress.notLoaded : progress.notDelivered;
  const q = query.trim().toLowerCase().replace(/^#/, "");
  const boxes = move.boxes.filter(b => (!q || String(b.n) === q || b.room.toLowerCase().includes(q) || (roomsSv[b.room] ?? "").toLowerCase().includes(q)) && (filter === "all" || (filter === "notes" ? Boolean(b.note) : missing.includes(b.n))));
  const helperUrl = credentials && helper ? `${location.origin}${sharePath({ id: credentials.id, key: helper })}` : "";
  const canWrite = !busy && online && !error;
  const expiry = new Date(move.expiresAt).toLocaleDateString(locale === "sv" ? "sv-SE" : "en-GB");

  return <>
    <div className="no-print">
      <Link className="md-back" href="/move"><ArrowLeft size={16} aria-hidden="true" /> {t("Packing list", "Packlista")}</Link>
      <header className="md-header"><div><div className="section-kicker">{t("MOVING DAY", "FLYTTDAGEN")} · {move.role === "owner" ? t("YOUR CONTROL LINK", "DIN KONTROLLÄNK") : t("HELPER VIEW", "HJÄLPARVY")}</div><h1>{move.title}</h1><p>{t("Check the box where it is, so everyone sees what's left.", "Pricka av kartongen där den är, så ser alla vad som återstår.")}</p></div><Users size={34} aria-hidden="true" /></header>
      {storageWarning && <p className="mv-notice error" role="alert">{t("This browser could not save your control link. Bookmark this page before leaving; it is the only way to manage or delete the shared copy.", "Webbläsaren kunde inte spara kontrollänken. Bokmärk sidan innan du lämnar den; den behövs för att hantera eller radera den delade kopian.")}</p>}
      {error && <p className="mv-notice error" role="alert">{error}</p>}
      <div className="md-sync"><span className={online && !error ? "md-connected" : "md-disconnected"}>{online && !error ? t(`Last confirmed ${updated} · refreshes every 8 seconds`, `Senast bekräftat ${updated} · uppdateras var 8:e sekund`) : t("Checks may be out of date", "Avprickningarna kan vara gamla")}</span><button type="button" disabled={busy} onClick={() => credentials && void readRef.current(credentials)}><RefreshCw size={16} aria-hidden="true" />{t("Refresh", "Uppdatera")}</button></div>

      <div className="md-stage" role="group" aria-label={t("Moving stage", "Flyttens steg")}><button type="button" aria-pressed={stage === "loading"} onClick={() => setStage("loading")}><Truck size={22} aria-hidden="true" /><span>{t("Loading", "Lastning")}<strong>{progress.loaded} / {progress.total}</strong></span></button><button type="button" aria-pressed={stage === "delivery"} onClick={() => setStage("delivery")}><Home size={22} aria-hidden="true" /><span>{t("Delivery", "Leverans")}<strong>{progress.delivered} / {progress.total}</strong></span></button></div>
      <section className={`md-summary ${missing.length ? "md-incomplete" : "md-complete"}`} aria-live="polite"><strong>{missing.length ? (stage === "loading" ? t(`${missing.length} still to load`, `${missing.length} kvar att lasta`) : t(`${missing.length} still to arrive`, `${missing.length} kvar att leverera`)) : (stage === "loading" ? t("Every box checked onto the van", "Alla kartonger avprickade i bilen") : t("Every box checked into the new home", "Alla kartonger avprickade i nya hemmet"))}</strong><p>{missing.length ? `${t("Box numbers", "Kartongnummer")}: ${missing.map(n => `#${n}`).join(", ")}` : t("Compare the checks with the boxes before you leave.", "Jämför avprickningarna med kartongerna innan ni åker.")}</p>{progress.exceptions > 0 && <button type="button" onClick={() => setFilter("notes")}>{t(`${progress.exceptions} box notes to review`, `${progress.exceptions} kartonganteckningar att läsa`)}</button>}</section>

      <div className="md-tools"><label><span className="sr-only">{t("Find box number or room", "Hitta kartongnummer eller rum")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Box number or room…", "Kartongnummer eller rum…")} /></label><div role="group" aria-label={t("Filter boxes", "Filtrera kartonger")}>{(["all", "remaining", "notes"] as const).map(f => <button type="button" key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "all" ? t("All", "Alla") : f === "remaining" ? t("Remaining", "Kvar") : t("With notes", "Med anteckning")}</button>)}</div></div>
      <ul className="md-box-list" aria-label={t("Shared boxes", "Delade kartonger")}>{boxes.map(box => <li key={box.n} className={`md-box md-${box.state}`} style={{ ["--room" as string]: roomColors[box.room] ?? "#171713" }}>
        <div className="md-box-ident"><strong>#{box.n}</strong><div><span>{locale === "sv" ? roomsSv[box.room] ?? box.room : box.room}</span><small>{[box.fragile && t("Fragile", "Ömtåligt"), box.heavy && t("Heavy", "Tungt")].filter(Boolean).join(" · ") || t("Ready to carry", "Redo att bära")}</small></div></div>
        <div className="md-box-check">{stage === "loading" ? box.state === "packed" ? <button className="primary-button" type="button" disabled={!canWrite} onClick={() => void updateBox(box, "loaded")} aria-label={t(`Mark box ${box.n} loaded`, `Markera kartong ${box.n} lastad`)}><Truck size={18} aria-hidden="true" />{t("Mark loaded", "Markera lastad")}</button> : <span className="md-done"><Check size={18} aria-hidden="true" />{box.state === "delivered" ? t("Delivered", "Levererad") : t("Loaded", "Lastad")}</span> : box.state === "delivered" ? <span className="md-done"><Check size={18} aria-hidden="true" />{t("Delivered", "Levererad")}</span> : <button className="primary-button" type="button" disabled={!canWrite || box.state === "packed"} onClick={() => void updateBox(box, "delivered")} aria-label={t(`Mark box ${box.n} delivered`, `Markera kartong ${box.n} levererad`)}><Home size={18} aria-hidden="true" />{box.state === "packed" ? t("Load first", "Lasta först") : t("Mark delivered", "Markera levererad")}</button>}</div>
        {box.note && <p className="md-box-note">{box.note}</p>}
        <div className="md-box-footer"><small>{box.revision ? `${t("Checked", "Avprickad")} ${new Date(box.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${box.updatedBy === "owner" ? t("organiser", "ansvarig") : t("helper", "hjälpare")}` : t("Not checked yet", "Inte avprickad ännu")}</small><button type="button" disabled={!canWrite} onClick={() => setEditor({ box, draft: box.note, conflict: false })}>{box.note ? t("Edit note", "Ändra anteckning") : t("Add problem / note", "Lägg till problem / anteckning")}</button>{box.state !== "packed" && <button type="button" disabled={!canWrite} onClick={() => { if (window.confirm(t(`Undo the last check for box ${box.n}?`, `Ångra senaste avprickningen för kartong ${box.n}?`))) void updateBox(box, box.state === "delivered" ? "loaded" : "packed"); }} aria-label={t(`Undo box ${box.n}`, `Ångra kartong ${box.n}`)}><RotateCcw size={15} aria-hidden="true" />{t("Undo", "Ångra")}</button>}</div>
      </li>)}</ul>
      {!boxes.length && <p className="mv-empty">{t("No boxes match this filter.", "Inga kartonger matchar filtret.")}</p>}

      {editor && <dialog ref={noteDialog} className="md-note-editor" aria-labelledby="md-note-title" onCancel={e => { e.preventDefault(); setEditor(null); }}><div><h2 id="md-note-title">{t(`Box ${editor.box.n}: problem or note`, `Kartong ${editor.box.n}: problem eller anteckning`)}</h2><button type="button" className="md-close" onClick={() => setEditor(null)} aria-label={t("Close note editor", "Stäng anteckningen")}><X size={20} aria-hidden="true" /></button></div><label htmlFor="md-note">{t("Visible to everyone with the link. Keep names and private details out.", "Synlig för alla med länken. Undvik namn och privata uppgifter.")}</label><textarea id="md-note" rows={3} maxLength={300} value={editor.draft} onChange={e => setEditor({ ...editor, draft: e.target.value })} placeholder={t("e.g. Corner dented — check contents together", "t.ex. Hörnet intryckt — kontrollera innehållet tillsammans")} />{editor.conflict && <p role="alert">{t("Another phone changed this box. Your draft is kept here. Copy it if needed, then reopen the latest note before saving.", "En annan mobil ändrade kartongen. Utkastet finns kvar här. Kopiera det vid behov och öppna sedan den senaste anteckningen innan du sparar.")}</p>}<div className="md-note-actions"><button className="primary-button" type="button" disabled={!canWrite || editor.conflict} onClick={() => void updateBox(editor.box, editor.box.state, editor.draft)}>{t("Save note", "Spara anteckning")}</button>{editor.conflict && <button type="button" className="secondary-button" onClick={() => { const latest = move.boxes.find(b => b.n === editor.box.n); if (latest) setEditor({ box: latest, draft: latest.note, conflict: false }); }}>{t("Open latest note", "Öppna senaste anteckning")}</button>}</div></dialog>}

      <section className="md-share-panel"><h2>{move.role === "owner" ? t("Your helpers, one shared list", "Dina hjälpare, en gemensam lista") : t("One list for everyone carrying", "En lista för alla som bär")}</h2><p>{move.role === "owner" ? t("Keep this page's control link private. Give helpers only the helper link below. They can check boxes and add notes; only your control link can replace their link or delete the shared copy.", "Håll den här sidans kontrollänk privat. Ge hjälparna bara hjälparlänken nedan. De kan pricka av och anteckna; bara kontrollänken kan ersätta deras länk eller radera den delade kopian.") : t("You can check boxes and add notes. The organiser controls sharing and deletion. Anyone you forward this link to gets the same access.", "Du kan pricka av och anteckna. Den ansvariga styr delning och radering. Alla du vidarebefordrar länken till får samma åtkomst.")}</p>
        {move.role === "owner" && <>{helperUrl && <><label htmlFor="md-helper-link">{t("Helper link", "Hjälparlänk")}</label><div className="md-copy-row"><input id="md-helper-link" value={helperUrl} readOnly onFocus={e => e.currentTarget.select()} /><button type="button" className="primary-button" onClick={async () => { try { await navigator.clipboard.writeText(helperUrl); setCopied(true); measure("move_day_shared", "move"); } catch { setCopied(false); } }}><Copy size={18} aria-hidden="true" />{copied ? t("Copied", "Kopierad") : t("Copy helper link", "Kopiera hjälparlänk")}</button></div></>}<div className="md-owner-actions"><button type="button" className="secondary-button" disabled={!canWrite} onClick={() => void rotate()}>{t("New helper link (revokes old)", "Ny hjälparlänk (stänger den gamla)")}</button><button type="button" className="secondary-button" disabled={busy || !online} onClick={() => void remove()}>{t("Delete shared copy", "Radera delad kopia")}</button></div><p className="mv-fine"><ShieldCheck size={14} aria-hidden="true" />{t("Bookmark this private control link so you can return from another device. If you lose it, the shared copy will still expire automatically.", "Bokmärk den privata kontrollänken för att komma tillbaka från en annan enhet. Tappar du bort den löper den delade kopian ändå ut automatiskt.")}</p></>}
        <p className="mv-fine">{t(`Shared until ${expiry}. Box numbers, rooms and flags only; no contents or packing notes. This list is a snapshot and does not change when the packing list is edited. Requires an internet connection.`, `Delad till ${expiry}. Bara kartongnummer, rum och markeringar; inget innehåll eller packanteckningar. Listan är en ögonblicksbild och ändras inte när packlistan redigeras. Kräver internetanslutning.`)}</p>
      </section>
      <div className="md-report-actions"><button type="button" className="primary-button" disabled={busy || Boolean(error)} onClick={() => window.print()}><Printer size={18} aria-hidden="true" />{t("Print / save status report as PDF", "Skriv ut / spara statusrapport som PDF")}</button><p>{t("A snapshot of shared checks, not a signed delivery receipt. Review notes with your helpers.", "En ögonblicksbild av gemensamma avprickningar, inget signerat leveranskvitto. Gå igenom anteckningarna med hjälparna.")}</p></div>
    </div>
    <StatusReport move={move} updated={updated} t={t} locale={locale} />
  </>;
}

function StatusReport({ move, updated, t, locale }: { move: SharedMove; updated: string; t: T; locale: string }) {
  const p = sharedProgress(move.boxes);
  return <section className="md-print-report"><p>STAYTAG · {t("MOVING DAY STATUS", "FLYTTDAGENS STATUS")}</p><h1>{move.title}</h1><p>{t("Last confirmed", "Senast bekräftat")} {updated} · {new Date().toLocaleDateString(locale === "sv" ? "sv-SE" : "en-GB")}</p><p>{t("Loaded", "Lastade")}: {p.loaded}/{p.total} · {t("Delivered", "Levererade")}: {p.delivered}/{p.total} · {t("With notes", "Med anteckning")}: {p.exceptions}</p><p>{t("Not delivered", "Inte levererade")}: {p.notDelivered.length ? p.notDelivered.map(n => `#${n}`).join(", ") : t("None", "Inga")}</p><table><thead><tr><th>#</th><th>{t("Room", "Rum")}</th><th>{t("Status", "Status")}</th><th>{t("Note", "Anteckning")}</th><th>{t("Last changed", "Senast ändrad")}</th></tr></thead><tbody>{move.boxes.map(b => <tr key={b.n}><td>{b.n}</td><td>{locale === "sv" ? roomsSv[b.room] ?? b.room : b.room}{b.fragile ? ` · ${t("fragile", "ömtåligt")}` : ""}{b.heavy ? ` · ${t("heavy", "tungt")}` : ""}</td><td>{b.state === "packed" ? t("Not loaded", "Inte lastad") : b.state === "loaded" ? t("Loaded", "Lastad") : t("Delivered", "Levererad")}</td><td>{b.note || "—"}</td><td>{b.revision ? `${new Date(b.updatedAt).toLocaleString(locale === "sv" ? "sv-SE" : "en-GB")} (${b.updatedBy === "owner" ? t("organiser", "ansvarig") : t("helper", "hjälpare")})` : "—"}</td></tr>)}</tbody></table><p>{t("Self-reported shared checks. Not a signed delivery receipt. No box contents are included. This report does not update after saving.", "Gemensamma självrapporterade avprickningar. Inget signerat leveranskvitto. Inget kartonginnehåll ingår. Rapporten uppdateras inte efter att du sparat den.")}</p></section>;
}
