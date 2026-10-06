"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { Check, Lock, PackageOpen, Pencil, Plus, Printer, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { movePassUrl } from "@/lib/commerce";
import { useLocale } from "@/lib/locale";
import { measure } from "@/lib/measure-client";
import { siteHost, siteUrl } from "@/lib/site";
import {
  FREE_BOXES, MAX_ITEMS, boxLabel, buildBoxUrl, canAddBox, getMoveSnapshot, getPassSnapshot, getServerSnapshot, hasPass, moveStats, nextBoxNumber,
  parseItems, parseMove, removeBox, roomColors, rooms, roomsSv, searchBoxes, subscribeMove, upsertBox, validSessionId, writeMove,
  confirmPass, needsRecheck, readPass, removePass,
  type Box, type Move
} from "@/lib/move";

type T = (en: string, sv: string) => string;
type Printable = { box: Box; qr: string; url: string };

export function roomName(room: string, locale: string): string {
  return locale === "sv" ? roomsSv[room] ?? room : room;
}

export function MovePlanner() {
  const { t, locale } = useLocale();
  const raw = useSyncExternalStore(subscribeMove, getMoveSnapshot, getServerSnapshot);
  const passRaw = useSyncExternalStore(subscribeMove, getPassSnapshot, getServerSnapshot);
  const parsed = useMemo(() => (raw === undefined ? null : parseMove(raw)), [raw]);
  const pass = hasPass(passRaw);
  const [editing, setEditing] = useState<Box | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [printing, setPrinting] = useState<{ mode: "labels" | "index"; rows: Printable[] } | null>(null);
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const session = params.get("pass");
    if (session !== null) {
      history.replaceState(null, "", "/move");
      if (!validSessionId(session)) {
        queueMicrotask(() => setNotice({ tone: "error", text: t("That receipt link could not be read. Paste the full link from your Stripe receipt below.", "Kvittolänken kunde inte läsas. Klistra in hela länken från Stripe-kvittot nedan.") }));
        return;
      }
      void confirmPass(session).then(outcome => {
        if (outcome === "unavailable") { setNotice({ tone: "error", text: t("Payment confirmation is temporarily unavailable, or this browser could not save your pass. Your receipt reference is kept when storage is available. Reload to retry; if it persists, email billing@nyttolabs.com. You do not need to pay again.", "Betalningen kunde inte bekräftas just nu, eller webbläsaren kunde inte spara passet. Kvittoreferensen sparas när lagring är tillgänglig. Ladda om för att försöka igen; kvarstår felet, mejla billing@nyttolabs.com. Du behöver inte betala igen.") }); return; }
        if (outcome === "rejected") { setNotice({ tone: "error", text: t("We could not find a completed Move Pass payment for that link. If you paid, email billing@nyttolabs.com with your receipt.", "Vi hittade ingen genomförd Move Pass-betalning för länken. Har du betalat, mejla billing@nyttolabs.com med kvittot.") }); return; }
        measure("move_pass_unlocked", "move");
        setNotice({ tone: "ok", text: t("Move Pass active on this device. Unlimited boxes. Thank you!", "Move Pass är aktivt på enheten. Obegränsat antal kartonger. Tack!") });
      });
      return;
    }
    // Quietly re-check a stored pass with Stripe; drop it only on a definite "not paid".
    const stored = readPass(getPassSnapshot());
    if (stored && needsRecheck(stored)) void confirmPass(stored.session).then(outcome => {
      if (outcome === "rejected") removePass();
      if (outcome === "paid" && !stored.verifiedAt) { measure("move_pass_unlocked", "move"); setNotice({ tone: "ok", text: t("Move Pass confirmed and active on this device.", "Move Pass bekräftat och aktivt på enheten.") }); }
      if (outcome === "unavailable" && !stored.verifiedAt) setNotice({ tone: "error", text: t("Your payment confirmation is still pending. Reload to retry or email billing@nyttolabs.com. You do not need to pay again.", "Betalningsbekräftelsen väntar fortfarande. Ladda om för att försöka igen eller mejla billing@nyttolabs.com. Du behöver inte betala igen.") });
    });
    // Read the redirect once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!printing) return;
    const id = requestAnimationFrame(() => window.print());
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    return () => { cancelAnimationFrame(id); window.removeEventListener("afterprint", done); };
  }, [printing]);

  // Hero and explainer render on the server too, so search engines and slow phones see the pitch at once.
  if (!parsed) return <><MoveHero t={t} /><p className="mv-loading" aria-live="polite">{t("Opening your move…", "Öppnar din flytt…")}</p><MoveHow t={t} /></>;
  const move = parsed.move;
  const stats = moveStats(move);
  const results = searchBoxes(move, query);
  const locked = !canAddBox(move, pass);

  function save(next: Move, message?: string): boolean {
    if (!writeMove(next)) { setNotice({ tone: "error", text: t("This browser blocks local storage (private mode?). Nothing was saved.", "Webbläsaren blockerar lokal lagring (privat läge?). Inget sparades.") }); return false; }
    if (message) setNotice({ tone: "ok", text: message });
    return true;
  }

  async function print(mode: "labels" | "index", boxes: Box[]) {
    if (!boxes.length) return;
    try {
      const rows = await Promise.all(boxes.map(async box => {
        const url = buildBoxUrl(siteUrl, boxLabel(move, box));
        return { box, url, qr: mode === "labels" ? await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, width: 900, color: { dark: "#000000", light: "#ffffff" } }) : "" };
      }));
      measure("move_labels_printed", "move");
      setPrinting({ mode, rows });
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : t("Could not prepare the labels.", "Kunde inte förbereda etiketterna.") }); }
  }

  return <>
    <MoveHero t={t} />

    {notice && <p className={`mv-notice ${notice.tone} no-print`} role={notice.tone === "error" ? "alert" : "status"}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label={t("Dismiss", "Stäng")}><X size={16} aria-hidden="true" /></button></p>}
    {parsed.damaged && <p className="mv-notice error no-print" role="alert">{t("Your saved move could not be read. Adding a box will start a new list.", "Den sparade flytten kunde inte läsas. Lägger du till en kartong startar en ny lista.")}</p>}

    <div className="mv-layout no-print">
      <section className="mv-panel" aria-labelledby="mv-add-title">
        <div className="mv-move-name">
          <label htmlFor="mv-name">{t("Move name (printed on labels)", "Flyttens namn (skrivs på etiketterna)")}</label>
          <input id="mv-name" value={move.name} maxLength={40} onChange={e => save({ ...move, name: e.target.value })} placeholder={t("e.g. Andersson → Uppsala", "t.ex. Andersson → Uppsala")} />
        </div>
        <BoxForm key={editing ? `edit-${editing.n}` : `new-${nextBoxNumber(move)}`} t={t} locale={locale} move={move} editing={editing} locked={!editing && locked}
          onLocked={() => { setPaywall(true); measure("move_paywall_shown", "move"); }}
          onCancel={() => setEditing(null)}
          onSave={box => {
            try {
              const next = upsertBox(move, box);
              if (save(next, editing ? t(`Box ${box.n} updated.`, `Kartong ${box.n} uppdaterad.`) : t(`Box ${box.n} added. Print its label when you're ready.`, `Kartong ${box.n} tillagd. Skriv ut etiketten när du vill.`))) {
                if (!editing) measure("move_box_added", "move");
                setEditing(null);
              }
            } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Error" }); }
          }} />
        {(paywall || locked) && !pass && <Paywall t={t} onRestore={async session => {
          if (!validSessionId(session)) { setNotice({ tone: "error", text: t("Paste the full link you landed on after paying (it contains cs_live_…).", "Klistra in hela länken du kom till efter betalningen (den innehåller cs_live_…).") }); return; }
          const outcome = await confirmPass(session);
          if (outcome === "unavailable") { setNotice({ tone: "error", text: t("We could not confirm and save your pass yet. Retry in a moment or email billing@nyttolabs.com. You do not need to pay again.", "Vi kunde inte bekräfta och spara passet ännu. Försök igen om en stund eller mejla billing@nyttolabs.com. Du behöver inte betala igen.") }); return; }
          if (outcome === "rejected") { setNotice({ tone: "error", text: t("That link is not a completed Move Pass payment.", "Länken är ingen genomförd Move Pass-betalning.") }); return; }
          measure("move_pass_unlocked", "move"); setPaywall(false); setNotice({ tone: "ok", text: t("Move Pass restored on this device.", "Move Pass återställt på enheten.") });
        }} />}
        {pass && <p className="mv-pass-active"><ShieldCheck size={16} aria-hidden="true" /> {t("Move Pass active: unlimited boxes on this device.", "Move Pass aktivt: obegränsat antal kartonger på enheten.")}</p>}
      </section>

      <section className="mv-boxes" aria-labelledby="mv-boxes-title">
        <div className="mv-boxes-head">
          <h2 id="mv-boxes-title">{t(`${stats.boxes} box${stats.boxes === 1 ? "" : "es"}`, `${stats.boxes} ${stats.boxes === 1 ? "kartong" : "kartonger"}`)}{stats.boxes > 0 && <small>{t(` · ${stats.items} items · ${stats.unpacked} unpacked`, ` · ${stats.items} saker · ${stats.unpacked} uppackade`)}</small>}</h2>
          <div className="mv-print-actions">
            <button type="button" className="primary-button" disabled={!move.boxes.length} onClick={() => void print("labels", move.boxes)}><Printer size={18} aria-hidden="true" /> {t("Print all labels", "Skriv ut alla etiketter")}</button>
            <button type="button" className="secondary-button" disabled={!move.boxes.length} onClick={() => void print("index", move.boxes)}>{t("Print box index", "Skriv ut kartonglista")}</button>
          </div>
        </div>
        {move.boxes.length > 0 && <label className="mv-search"><Search size={18} aria-hidden="true" /><span className="sr-only">{t("Search boxes", "Sök i kartonger")}</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Which box has… the kettle?", "Vilken kartong har… vattenkokaren?")} enterKeyHint="search" /></label>}
        {move.boxes.length === 0 ? <EmptyMove t={t} /> : results.length === 0 ? <p className="mv-empty-search">{t(`Nothing called “${query}” in any box.`, `Inget som heter ”${query}” i någon kartong.`)}</p> :
          <ul className="mv-list">{results.map(({ box, hits }) => <li key={box.n} className={`mv-box${box.unpacked ? " is-unpacked" : ""}`} style={{ ["--room" as string]: roomColors[box.room] ?? "#171713" }}>
            <div className="mv-box-top"><span className="mv-box-no">#{box.n}</span><span className="mv-box-room">{roomName(box.room, locale)}</span>{box.fragile && <span className="mv-flag">{t("Fragile", "Ömtåligt")}</span>}{box.heavy && <span className="mv-flag">{t("Heavy", "Tungt")}</span>}</div>
            <p className="mv-box-items">{box.items.length ? box.items.map((item, i) => <span key={i} className={hits.includes(item) ? "hit" : ""}>{item}{i < box.items.length - 1 ? ", " : ""}</span>) : <em>{t("No contents listed", "Inget innehåll angivet")}</em>}</p>
            {box.note && <p className="mv-box-note">{box.note}</p>}
            <div className="mv-box-actions">
              <button type="button" onClick={() => save(upsertBox(move, { ...box, unpacked: !box.unpacked }))} aria-pressed={Boolean(box.unpacked)}><Check size={16} aria-hidden="true" /> {box.unpacked ? t("Unpacked", "Uppackad") : t("Mark unpacked", "Markera uppackad")}</button>
              <button type="button" onClick={() => { setEditing(box); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={16} aria-hidden="true" /> {t("Edit", "Ändra")}</button>
              <button type="button" onClick={() => void print("labels", [box])}><Printer size={16} aria-hidden="true" /> {t("Label", "Etikett")}</button>
              <button type="button" onClick={() => { if (window.confirm(t(`Delete box ${box.n} from this device?`, `Radera kartong ${box.n} från enheten?`))) save(removeBox(move, box.n), t(`Box ${box.n} deleted. Its printed label still shows the contents.`, `Kartong ${box.n} raderad. Den utskrivna etiketten visar fortfarande innehållet.`)); }} aria-label={t(`Delete box ${box.n}`, `Radera kartong ${box.n}`)}><Trash2 size={16} aria-hidden="true" /></button>
            </div>
          </li>)}</ul>}
        {stats.rooms.length > 0 && <p className="mv-rooms">{stats.rooms.map(r => <span key={r.room} style={{ ["--room" as string]: roomColors[r.room] ?? "#171713" }}>{roomName(r.room, locale)} {r.count}</span>)}</p>}
      </section>
    </div>

    <MoveHow t={t} />

    {printing && <PrintSheet t={t} locale={locale} move={move} mode={printing.mode} rows={printing.rows} />}
  </>;
}

function BoxForm({ t, locale, move, editing, locked, onSave, onCancel, onLocked }: { t: T; locale: string; move: Move; editing: Box | null; locked: boolean; onSave: (box: Box) => void; onCancel: () => void; onLocked: () => void }) {
  const last = move.boxes.at(-1);
  const [room, setRoom] = useState(editing?.room ?? last?.room ?? "Kitchen");
  const [items, setItems] = useState(editing ? editing.items.join("\n") : "");
  const [fragile, setFragile] = useState(editing?.fragile ?? false);
  const [heavy, setHeavy] = useState(editing?.heavy ?? false);
  const [note, setNote] = useState(editing?.note ?? "");
  const itemsRef = useRef<HTMLTextAreaElement>(null);
  const n = editing?.n ?? nextBoxNumber(move);
  const count = parseItems(items).length;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (locked) { onLocked(); return; }
    onSave({ n, room, items: parseItems(items), fragile, heavy, ...(note.trim() ? { note: note.trim().slice(0, 80) } : {}), ...(editing?.unpacked ? { unpacked: true } : {}) });
    itemsRef.current?.focus();
  }

  return <form className="mv-form" onSubmit={submit} aria-labelledby="mv-add-title">
    <h2 id="mv-add-title">{editing ? t(`Edit box ${n}`, `Ändra kartong ${n}`) : t(`Box ${n}`, `Kartong ${n}`)}</h2>
    <fieldset className="mv-rooms-pick"><legend>{t("Room", "Rum")}</legend>
      {rooms.map(value => <label key={value} style={{ ["--room" as string]: roomColors[value] }}><input type="radio" name="room" checked={room === value} onChange={() => setRoom(value)} /><span>{roomName(value, locale)}</span></label>)}
    </fieldset>
    <label className="mv-field" htmlFor="mv-items">{t("What's inside?", "Vad finns i den?")} <small>{t(`${count}/${MAX_ITEMS} · one per line or comma`, `${count}/${MAX_ITEMS} · en per rad eller kommatecken`)}</small></label>
    <textarea id="mv-items" ref={itemsRef} rows={5} value={items} onChange={e => setItems(e.target.value)} placeholder={t("Kettle, coffee maker, mugs, cutlery, tea towels", "Vattenkokare, kaffebryggare, muggar, bestick, kökshanddukar")} />
    <div className="mv-toggles">
      <label><input type="checkbox" checked={fragile} onChange={e => setFragile(e.target.checked)} /> {t("Fragile", "Ömtåligt")}</label>
      <label><input type="checkbox" checked={heavy} onChange={e => setHeavy(e.target.checked)} /> {t("Heavy", "Tungt")}</label>
    </div>
    <label className="mv-field" htmlFor="mv-note">{t("Note (optional)", "Anteckning (valfritt)")}</label>
    <input id="mv-note" value={note} maxLength={80} onChange={e => setNote(e.target.value)} placeholder={t("Open first · Upstairs · Lisa's", "Öppna först · Övervåningen · Lisas")} />
    <div className="mv-form-actions">
      <button type="submit" className="primary-button">{locked ? <Lock size={18} aria-hidden="true" /> : editing ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />} {editing ? t("Save box", "Spara kartong") : t(`Add box ${n}`, `Lägg till kartong ${n}`)}</button>
      {editing && <button type="button" className="secondary-button" onClick={onCancel}>{t("Cancel", "Avbryt")}</button>}
    </div>
  </form>;
}

function Paywall({ t, onRestore }: { t: T; onRestore: (session: string) => void | Promise<void> }) {
  const [receipt, setReceipt] = useState("");
  return <aside className="mv-paywall" aria-labelledby="mv-paywall-title">
    <div className="section-kicker">MOVE PASS</div>
    <h3 id="mv-paywall-title">{t(`You've labelled ${FREE_BOXES} boxes. Keep going?`, `Du har märkt ${FREE_BOXES} kartonger. Fortsätta?`)}</h3>
    <p>{t("Your boxes are saved. One payment of SEK 79 (about €7, shown in your currency at checkout) unlocks the rest of this move.", "Dina kartonger är sparade. En betalning på 79 kr låser upp resten av flytten.")}</p>
    <ul className="mv-gets" aria-label={t("What you get right after paying", "Det här får du direkt efter betalningen")}>
      <li><Check size={16} aria-hidden="true" /> {t("Unlimited boxes for this move — keep adding right away", "Obegränsat antal kartonger för flytten — fortsätt direkt")}</li>
      <li><Check size={16} aria-hidden="true" /> {t("Print every label plus the full box index", "Skriv ut alla etiketter plus hela kartonglistan")}</li>
      <li><Check size={16} aria-hidden="true" /> {t("You land back here, unlocked on this device — no account, no app", "Du kommer tillbaka hit, upplåst på enheten — inget konto, ingen app")}</li>
      <li><Check size={16} aria-hidden="true" /> {t("One payment, no subscription. Receipt by email.", "En betalning, ingen prenumeration. Kvitto via e-post.")}</li>
    </ul>
    <a className="primary-button mv-buy" href={movePassUrl} data-move-checkout="true" rel="noopener">{t("Unlock all boxes · SEK 79 (≈ €7)", "Lås upp alla kartonger · 79 kr")}</a>
    <p className="mv-fine">{t("Secure card payment by Stripe (Apple Pay / Google Pay where available). Your box list stays on this device and is never sent to us or to Stripe.", "Säker kortbetalning via Stripe (Apple Pay / Google Pay där det finns). Kartonglistan stannar på enheten och skickas aldrig till oss eller till Stripe.")}</p>
    <details className="mv-restore"><summary>{t("Already paid on another device?", "Redan betalt på en annan enhet?")}</summary>
      <label htmlFor="mv-receipt">{t("Paste the link you landed on after paying", "Klistra in länken du kom till efter betalningen")}</label>
      <div><input id="mv-receipt" value={receipt} onChange={e => setReceipt(e.target.value)} placeholder="https://staytag.nyttolabs.com/move?pass=cs_live_…" autoCapitalize="off" spellCheck={false} />
        <button type="button" className="secondary-button" onClick={() => { const match = /cs_(?:live|test)_[A-Za-z0-9]+/.exec(receipt); void onRestore(match ? match[0] : ""); }}>{t("Restore", "Återställ")}</button></div>
      <small>{t("Lost it? Email billing@nyttolabs.com with your receipt.", "Tappat bort den? Mejla billing@nyttolabs.com med ditt kvitto.")}</small>
    </details>
  </aside>;
}

function EmptyMove({ t }: { t: T }) {
  return <div className="mv-empty">
    <div className="mv-example" aria-hidden="true" style={{ ["--room" as string]: roomColors.Kitchen }}>
      <div className="mv-example-band">KITCHEN</div>
      <div className="mv-example-body"><strong>#7</strong><span>Kettle, coffee maker, mugs, cutlery, tea towels…</span><em>FRAGILE</em></div>
    </div>
    <p><PackageOpen size={18} aria-hidden="true" /> {t("Add your first box on the left. Pick the room, list what's inside, done. The next box number is ready instantly.", "Lägg till din första kartong. Välj rum, skriv vad som finns i den, klart. Nästa kartongnummer är redo direkt.")}</p>
  </div>;
}

function PrintSheet({ t, locale, move, mode, rows }: { t: T; locale: string; move: Move; mode: "labels" | "index"; rows: Printable[] }) {
  if (mode === "index") return <section className="mv-print mv-print-index" aria-hidden="true">
    <h1>{move.name || "My move"} — {t("box index", "kartonglista")}</h1>
    <table><thead><tr><th>#</th><th>{t("Room", "Rum")}</th><th>{t("Contents", "Innehåll")}</th><th>✓</th></tr></thead>
      <tbody>{rows.map(({ box }) => <tr key={box.n}><td><strong>{box.n}</strong></td><td>{roomName(box.room, locale)}{box.fragile ? ` · ${t("Fragile", "Ömtåligt")}` : ""}{box.heavy ? ` · ${t("Heavy", "Tungt")}` : ""}</td><td>{box.items.join(", ")}{box.note ? ` — ${box.note}` : ""}</td><td>☐</td></tr>)}</tbody></table>
    <p>{siteHost}/move</p>
  </section>;
  return <section className="mv-print" aria-hidden="true">{rows.map(({ box, qr }) => <article key={box.n} className="mv-label" style={{ ["--room" as string]: roomColors[box.room] ?? "#171713" }}>
    <div className="mv-label-band">{roomName(box.room, locale).toUpperCase()}</div>
    <div className="mv-label-body">
      <div className="mv-label-text">
        <span className="mv-label-move">{move.name || "My move"}</span>
        <strong className="mv-label-no">#{box.n}</strong>
        <div className="mv-label-flags">{box.fragile && <span>{t("FRAGILE", "ÖMTÅLIGT")}</span>}{box.heavy && <span>{t("HEAVY", "TUNGT")}</span>}</div>
        <ul>{box.items.slice(0, 8).map((item, i) => <li key={i}>{item}</li>)}{box.items.length > 8 && <li>{t(`+ ${box.items.length - 8} more — scan`, `+ ${box.items.length - 8} till — skanna`)}</li>}</ul>
        {box.note && <p className="mv-label-note">{box.note}</p>}
      </div>
      <div className="mv-label-qr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="" />
        <small>{t("Scan to see everything inside", "Skanna för att se allt innehåll")}<br />{siteHost}</small>
      </div>
    </div>
  </article>)}</section>;
}

function MoveHero({ t }: { t: T }) {
  return <>
    <header className="mv-hero no-print">
      <div className="section-kicker">STAYTAG MOVE</div>
      <h1>{t("Moving? Never open the wrong box again.", "Flyttar du? Öppna aldrig fel kartong igen.")}</h1>
      <p>{t("A QR label on every box. Scan any box to see everything inside — you, your partner or the friend carrying it. No app, no account.", "En QR-etikett på varje kartong. Skanna valfri kartong och se allt som finns i den — du, din partner eller kompisen som bär. Ingen app, inget konto.")}</p>
      <div className="mv-chips"><span>{t(`${FREE_BOXES} boxes free`, `${FREE_BOXES} kartonger gratis`)}</span><span>{t("Move Pass: unlimited, SEK 79 once (about €7)", "Move Pass: obegränsat, 79 kr en gång")}</span><span>{t("Prints on plain A4 or US Letter", "Skrivs ut på vanligt A4")}</span></div>
    </header>
  </>;
}

function MoveHow({ t }: { t: T }) {
  return <>
    <section className="mv-how no-print" aria-labelledby="mv-how-title">
      <h2 id="mv-how-title">{t("Why it beats a marker pen", "Varför det slår en tuschpenna")}</h2>
      <div className="mv-how-grid">
        <article><h3>{t("“KITCHEN” isn't enough", "”KÖK” räcker inte")}</h3><p>{t("The label lists every item. Scan to see all of it without cutting the tape.", "Etiketten listar allt. Skanna och se innehållet utan att skära upp tejpen.")}</p></article>
        <article><h3>{t("Find anything in seconds", "Hitta vad som helst på sekunder")}</h3><p>{t("Search “charger” on your phone and get the box number.", "Sök ”laddare” i telefonen och få kartongnumret.")}</p></article>
        <article><h3>{t("Helpers know where it goes", "Hjälparna vet vart det ska")}</h3><p>{t("A colour band per room. Big numbers. Fragile and heavy flags.", "Ett färgband per rum. Stora nummer. Ömtåligt och tungt syns direkt.")}</p></article>
        <article><h3>{t("Private, no account", "Privat, inget konto")}</h3><p>{t("Your list stays on this device. Each QR holds only that box's contents — no name, no address.", "Listan stannar på enheten. Varje QR innehåller bara den kartongens innehåll — inget namn, ingen adress.")}</p></article>
      </div>
      <p className="mv-fine">{t("Tip: print on plain A4 or US Letter, two labels per page, and tape one to the top and one to the side. Moving company or relocation service? ", "Tips: skriv ut på vanligt A4, två etiketter per sida, och tejpa en på locket och en på sidan. Flyttfirma? ")}<Link href="/movers">{t("Free for your customers: see how.", "Gratis för era kunder: så funkar det.")}</Link> <Link href="/">{t("Labels for filters and machines →", "Etiketter för filter och maskiner →")}</Link></p>
    </section>
  </>;
}
