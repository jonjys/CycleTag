"use client";

import QRCode from "qrcode";
import { Archive, ArrowLeft, Bell, Camera, Check, ClipboardPaste, Download, ExternalLink, ImageUp, Pencil, Plus, RotateCcw, ShieldCheck, Trash2, Type, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type ClipboardEvent, type FormEvent, type ReactNode } from "react";
import { useLocale } from "@/lib/locale";
import { measure } from "@/lib/measure-client";
import { triggerDownload } from "@/lib/download";
import { siteUrl } from "@/lib/site";
import { decodeImageFile, shrinkImage, startCameraScan, type DecodedCode } from "@/lib/qr-decode";
import { blobToDataUrl, clearReturnImages, dataUrlToBlob, deleteReturnImage, loadReturnImage, saveReturnImage } from "@/lib/return-images";
import {
  addDays, codeLinkHost, createReturn, createReturnIcs, currencies, findDuplicate, formatAmount, getReturnsServerSnapshot, getReturnsSnapshot,
  isActive, mergeBackup, nextStatus, parseAmount, parseReturns, pendingTotals, previousStatus, returnCountdown, reminderOffsets, safeCodeLink,
  sortReturns, subscribeReturns, transition, updateReturn, writeReturns, buildBackup, lifecycle, dayDiff, RETURN_CODE_MAX, RETURNS_LIMIT,
  type CodeKind, type Currency, type ReminderOffset, type ReturnDraft, type ReturnItem, type ReturnStatus, type WriteResult
} from "@/lib/returns";

type T = (en: string, sv: string) => string;
type Notice = { text: string; tone: "ok" | "error" };

const stores = ["Zalando", "H&M", "Amazon", "Boozt", "Nelly", "Zara", "ASOS", "IKEA", "Apotea", "Elgiganten", "Adlibris", "CDON", "Lyko", "Nike", "Adidas", "Jollyroom", "Clas Ohlson", "Stadium", "Ellos", "Bubbleroom"];
const methods = ["PostNord", "DHL", "Budbee", "Instabox", "UPS", "InPost", "Bring", "DPD", "Hermes", "Royal Mail", "In store"];
const sampleWalletUrl = `${siteUrl}/returns`;

function localToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDay(day: string, locale: string, today: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale === "sv" ? "sv-SE" : "en-GB", { day: "numeric", month: "short", ...(day.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" } : {}), timeZone: "UTC" }).format(date);
}

function statusLabel(status: ReturnStatus, t: T): string {
  return { ready: t("Ready to return", "Redo att returnera"), dropped: t("Dropped off", "Inlämnad"), pending: t("Refund pending", "Väntar på återbetalning"), refunded: t("Refunded", "Återbetald"), kept: t("Kept it", "Behöll den") }[status];
}

function nextActionLabel(status: ReturnStatus, t: T): string {
  return { ready: t("I dropped it off", "Jag har lämnat in den"), dropped: t("Store has received it", "Butiken har tagit emot den"), pending: t("Refund received", "Pengarna har kommit"), refunded: "", kept: "" }[status];
}

function countdownText(item: ReturnItem, today: string, locale: string, t: T): { text: string; tone: string } | null {
  const c = returnCountdown(item.deadline, today);
  if (!c || !item.deadline) return null;
  if (c.tone === "overdue") return { text: t(`Return window passed ${formatDay(item.deadline, locale, today)}`, `Returfristen gick ut ${formatDay(item.deadline, locale, today)}`), tone: c.tone };
  if (c.tone === "today") return { text: t("Return today", "Returnera i dag"), tone: c.tone };
  if (c.tone === "urgent" || c.tone === "soon") return { text: c.days === 1 ? t("1 day left", "1 dag kvar") : t(`${c.days} days left`, `${c.days} dagar kvar`), tone: c.tone };
  return { text: t(`Return by ${formatDay(item.deadline, locale, today)}`, `Returnera senast ${formatDay(item.deadline, locale, today)}`), tone: c.tone };
}

function writeError(result: WriteResult, t: T): string {
  if (result.ok) return "";
  if (result.reason === "damaged") return t("Your saved returns could not be read. Reset them below before adding more.", "Dina sparade returer kunde inte läsas. Återställ dem nedan innan du lägger till fler.");
  if (result.reason === "full") return t(`The wallet holds ${RETURNS_LIMIT} returns. Delete finished ones in History first.`, `Plånboken rymmer ${RETURNS_LIMIT} returer. Radera avslutade i Historik först.`);
  if (result.reason === "quota") return t("This browser’s storage is full. Delete old returns or screenshots.", "Webbläsarens lagring är full. Radera gamla returer eller skärmdumpar.");
  return t("This browser blocks local storage (private mode?). Nothing was saved.", "Webbläsaren blockerar lokal lagring (privat läge?). Inget sparades.");
}

export function ReturnWallet() {
  const { t, locale } = useLocale();
  const raw = useSyncExternalStore(subscribeReturns, getReturnsSnapshot, getReturnsServerSnapshot);
  const state = useMemo(() => (raw === undefined ? null : parseReturns(raw)), [raw]);
  const [today] = useState(localToday);
  const [editing, setEditing] = useState<ReturnItem | "new" | null>(null);
  const [showing, setShowing] = useState<ReturnItem | "sample" | null>(null);
  const [reminder, setReminder] = useState<ReturnItem | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    measure("return_wallet_opened", "returns");
  }, []);

  if (!state) return <section className="rw-loading" aria-live="polite">{t("Opening your returns…", "Öppnar dina returer…")}</section>;

  const items = state.items;
  const active = sortReturns(items.filter(isActive));
  const history = items.filter(item => !isActive(item)).sort((a, b) => ((b.refundedAt ?? b.createdAt) > (a.refundedAt ?? a.createdAt) ? 1 : -1));
  const totals = pendingTotals(items);
  const toReturn = active.filter(item => item.status === "ready").length;
  const waiting = active.length - toReturn;

  function save(next: ReturnItem[], message?: string): boolean {
    const result = writeReturns(next);
    if (!result.ok) { setNotice({ tone: "error", text: writeError(result, t) }); return false; }
    if (message) setNotice({ tone: "ok", text: message });
    return true;
  }

  function move(item: ReturnItem, to: ReturnStatus) {
    const next = transition(item, to, today);
    if (!save(items.map(existing => (existing.id === item.id ? next : existing)), `${item.store}: ${statusLabel(to, t).toLowerCase()}.`)) return;
    if (to === "dropped") measure("return_dropped_off", "returns");
    if (to === "refunded") measure("return_refunded", "returns");
    if (showing && showing !== "sample" && showing.id === item.id) setShowing(null);
  }

  async function remove(item: ReturnItem) {
    if (!window.confirm(t(`Delete the ${item.store} return from this device?`, `Radera returen till ${item.store} från enheten?`))) return;
    if (save(items.filter(existing => existing.id !== item.id), t("Deleted from this device.", "Raderad från enheten."))) await deleteReturnImage(item.id);
  }

  return <>
    <header className="rw-hero">
      <div className="section-kicker">STAYTAG · RETURN WALLET</div>
      <h1>{t("Never print a return label again.", "Skriv aldrig ut en returetikett igen.")}</h1>
      <p>{t("Save the return QR from the email once. At the counter, tap one button and hold up your phone.", "Spara retur-QR:en från mejlet en gång. Vid disken trycker du på en knapp och visar telefonen.")}</p>
      <div className="rw-hero-actions">
        <button type="button" className="primary-button rw-add" onClick={() => setEditing("new")}><Plus size={20} aria-hidden="true" /> {t("Add a return", "Lägg till retur")}</button>
      </div>
      <p className="rw-privacy-line"><ShieldCheck size={15} aria-hidden="true" /> {t("Saved on this phone only. Screenshots are read on your device, never uploaded.", "Sparas bara på den här telefonen. Skärmdumpar läses på enheten och laddas aldrig upp.")}</p>
    </header>

    {notice && <p className={`rw-notice ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label={t("Dismiss", "Stäng")}><X size={16} aria-hidden="true" /></button></p>}

    {state.damaged && <DamagedBanner t={t} onReset={async () => {
      if (!window.confirm(t("Reset Return Wallet on this device? Unreadable data is removed.", "Återställa returplånboken på enheten? Oläsbar data tas bort."))) return;
      const result = writeReturns([], undefined, { overwriteDamaged: true });
      if (result.ok) { await clearReturnImages(); setNotice({ tone: "ok", text: t("Return Wallet reset.", "Returplånboken är återställd.") }); }
      else setNotice({ tone: "error", text: writeError(result, t) });
    }} />}
    {state.skipped > 0 && <p className="rw-notice error" role="status">{t(`${state.skipped} damaged return(s) could not be shown.`, `${state.skipped} skadade returer kunde inte visas.`)}</p>}

    {items.length > 0 && <section className="rw-summary" aria-label={t("Summary", "Översikt")}>
      <div><strong>{toReturn}</strong><span>{t("to return", "att returnera")}</span></div>
      <div><strong>{waiting}</strong><span>{t("waiting for refund", "väntar på pengar")}</span></div>
      <div className="rw-money"><strong>{totals.length ? totals.map(total => formatAmount(total.amount, total.currency, locale)).join(" + ") : "—"}</strong><span>{t("on the way back", "på väg tillbaka")}</span></div>
    </section>}

    {active.length > 0 ? <section className="rw-list" aria-label={t("Active returns", "Aktiva returer")}>
      {active.map(item => <ReturnCard key={item.id} item={item} today={today} t={t} locale={locale}
        onShow={() => { setShowing(item); measure("return_code_opened", "returns"); }}
        onMove={to => move(item, to)} onEdit={() => setEditing(item)} onRemind={() => setReminder(item)} onDelete={() => void remove(item)} />)}
    </section> : !state.damaged && <EmptyState t={t} onAdd={() => setEditing("new")} onSample={() => setShowing("sample")} hasHistory={history.length > 0} />}

    {history.length > 0 && <details className="rw-history">
      <summary><Archive size={18} aria-hidden="true" /> {t(`History (${history.length})`, `Historik (${history.length})`)}</summary>
      <ul>{history.map(item => <li key={item.id}>
        <div><strong>{item.store}</strong>{item.product && <span>{item.product}</span>}<small>{statusLabel(item.status, t)}{item.refundedAt ? ` · ${formatDay(item.refundedAt, locale, today)}` : ""}{item.amount !== undefined && item.currency ? ` · ${formatAmount(item.amount, item.currency, locale)}` : ""}</small></div>
        <div className="rw-history-actions">
          <button type="button" onClick={() => move(item, item.status === "kept" ? "ready" : "pending")}><RotateCcw size={16} aria-hidden="true" /> {t("Restore", "Återställ")}</button>
          <button type="button" onClick={() => void remove(item)}><Trash2 size={16} aria-hidden="true" /> {t("Delete", "Radera")}</button>
        </div>
      </li>)}</ul>
    </details>}

    <HowItWorks t={t} />
    <DataPanel t={t} items={items} onNotice={setNotice} damaged={state.damaged} />

    {editing && <ReturnForm key={editing === "new" ? "new" : editing.id} t={t} locale={locale} today={today} items={items} initial={editing === "new" ? null : editing}
      onClose={() => setEditing(null)}
      onSaved={(message) => { setEditing(null); setNotice({ tone: "ok", text: message }); }} />}
    {showing && <CodeView t={t} locale={locale} today={today} item={showing === "sample" ? sampleReturn(today) : showing} sample={showing === "sample"}
      onClose={() => setShowing(null)} onDropped={showing !== "sample" && showing.status === "ready" ? () => move(showing, "dropped") : undefined} />}
    {reminder && <ReminderDialog t={t} item={reminder} today={today} onClose={() => setReminder(null)} onDone={text => { setReminder(null); setNotice({ tone: "ok", text }); }} />}
  </>;
}

function sampleReturn(today: string): ReturnItem {
  return { v: 1, id: "sample00", store: "Zalando", product: "Nike Air Max 90", deadline: addDays(today, 12), amount: 1499, currency: "SEK", code: "STAYTAG-EXAMPLE-RETURN-0000", codeKind: "qr", hasImage: false, method: "PostNord", status: "ready", createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, ".000Z") };
}

function EmptyState({ t, onAdd, onSample, hasHistory }: { t: T; onAdd: () => void; onSample: () => void; hasHistory: boolean }) {
  return <section className="rw-empty">
    <div className="rw-example" aria-label={t("Example return", "Exempel på retur")}>
      <div className="rw-card-top"><span className="rw-store">Zalando</span><span className="rw-chip calm">{t("Example", "Exempel")}</span></div>
      <h2>Nike Air Max 90</h2>
      <p className="rw-meta">1 499 kr · PostNord · {t("12 days left", "12 dagar kvar")}</p>
      <button type="button" className="rw-show" onClick={onSample}>{t("Show return QR", "Visa retur-QR")}</button>
    </div>
    <div className="rw-empty-copy">
      <h2>{hasHistory ? t("Nothing waiting to go back.", "Inget som ska tillbaka.") : t("Your returns, ready when the cashier asks.", "Dina returer, redo när kassan frågar.")}</h2>
      <ol>
        <li><strong>{t("Screenshot", "Skärmdump")}</strong> {t("the return QR in the shop’s email.", "retur-QR:en i butikens mejl.")}</li>
        <li><strong>{t("Add it here", "Lägg till här")}</strong> {t("with the store and last return day.", "med butik och sista returdag.")}</li>
        <li><strong>{t("Tap “Show return QR”", "Tryck ”Visa retur-QR”")}</strong> {t("at the drop-off point.", "vid inlämningsstället.")}</li>
      </ol>
      <button type="button" className="primary-button" onClick={onAdd}><Plus size={20} aria-hidden="true" /> {t("Add your first return", "Lägg till din första retur")}</button>
    </div>
  </section>;
}

function ReturnCard({ item, today, t, locale, onShow, onMove, onEdit, onRemind, onDelete }: { item: ReturnItem; today: string; t: T; locale: string; onShow: () => void; onMove: (to: ReturnStatus) => void; onEdit: () => void; onRemind: () => void; onDelete: () => void }) {
  const countdown = item.status === "ready" ? countdownText(item, today, locale, t) : null;
  const next = nextStatus(item.status);
  const back = previousStatus(item.status);
  const sinceDrop = item.droppedAt ? dayDiff(item.droppedAt, today) : null;
  const linkHost = codeLinkHost(item.code);
  const link = safeCodeLink(item.code);
  const hasCode = item.codeKind !== "none" || item.hasImage;
  const step = lifecycle.indexOf(item.status);
  return <article className={`rw-card status-${item.status}${countdown ? ` tone-${countdown.tone}` : ""}`} aria-labelledby={`rw-${item.id}`}>
    <div className="rw-card-top">
      <span className="rw-store" id={`rw-${item.id}`}>{item.store}</span>
      {countdown ? <span className={`rw-chip ${countdown.tone}`}>{countdown.text}</span> : <span className="rw-chip calm">{statusLabel(item.status, t)}</span>}
    </div>
    {item.product && <h2>{item.product}</h2>}
    <p className="rw-meta">{[item.amount !== undefined && item.currency ? formatAmount(item.amount, item.currency, locale) : null, item.method, item.status === "ready" && item.deadline && countdown?.tone !== "calm" ? t(`by ${formatDay(item.deadline, locale, today)}`, `senast ${formatDay(item.deadline, locale, today)}`) : null].filter(Boolean).join(" · ") || t("No details yet", "Inga detaljer ännu")}</p>
    {item.note && <p className="rw-note">{item.note}</p>}
    {item.status === "ready" && (hasCode
      ? <button type="button" className="rw-show" onClick={onShow}>{t("Show return QR", "Visa retur-QR")}</button>
      : <button type="button" className="rw-show rw-show-empty" onClick={onEdit}><ImageUp size={18} aria-hidden="true" /> {t("Add the return code", "Lägg till returkoden")}</button>)}
    {item.status !== "ready" && sinceDrop !== null && <p className="rw-progress">
      {sinceDrop <= 0 ? t("Dropped off today.", "Inlämnad i dag.") : t(`Dropped off ${sinceDrop} day${sinceDrop === 1 ? "" : "s"} ago.`, `Inlämnad för ${sinceDrop} ${sinceDrop === 1 ? "dag" : "dagar"} sedan.`)}
      {sinceDrop >= 14 && item.status !== "refunded" ? ` ${t(`No refund yet? Contact ${item.store} with your order details.`, `Inga pengar än? Kontakta ${item.store} med dina orderuppgifter.`)}` : ""}
    </p>}
    <ol className="rw-steps" aria-label={t("Return progress", "Returens status")}>
      {lifecycle.map((status, index) => <li key={status} className={index < step ? "done" : index === step ? "current" : ""} aria-current={index === step ? "step" : undefined}><span aria-hidden="true">{index < step ? <Check size={12} /> : index + 1}</span>{statusLabel(status, t)}</li>)}
    </ol>
    <div className="rw-card-actions">
      {next && <button type="button" className="rw-next" onClick={() => onMove(next)}><Check size={18} aria-hidden="true" /> {nextActionLabel(item.status, t)}</button>}
      {item.status !== "ready" && hasCode && <button type="button" className="rw-link-button" onClick={onShow}>{t("Show code again", "Visa koden igen")}</button>}
    </div>
    <details className="rw-more">
      <summary>{t("More", "Mer")}</summary>
      <div>
        <button type="button" onClick={onEdit}><Pencil size={16} aria-hidden="true" /> {t("Edit", "Ändra")}</button>
        {item.status === "ready" && <button type="button" onClick={onRemind} disabled={!item.deadline} title={item.deadline ? undefined : t("Add a return-by date first", "Lägg till sista returdag först")}><Bell size={16} aria-hidden="true" /> {t("Remind me", "Påminn mig")}</button>}
        {back && <button type="button" onClick={() => onMove(back)}><RotateCcw size={16} aria-hidden="true" /> {t(`Back to “${statusLabel(back, t)}”`, `Tillbaka till ”${statusLabel(back, t)}”`)}</button>}
        {item.status === "ready" && <button type="button" onClick={() => onMove("kept")}><Archive size={16} aria-hidden="true" /> {t("I kept it", "Jag behöll den")}</button>}
        <button type="button" onClick={onDelete}><Trash2 size={16} aria-hidden="true" /> {t("Delete", "Radera")}</button>
      </div>
      {link && linkHost && <p className="rw-code-link">{t("This code contains a link to", "Koden innehåller en länk till")} <strong>{linkHost}</strong>. <a href={link} target="_blank" rel="noopener noreferrer nofollow">{t("Open it", "Öppna den")} <ExternalLink size={14} aria-hidden="true" /></a></p>}
    </details>
  </article>;
}

function useModal(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) {
      try { dialog.showModal(); } catch { dialog.setAttribute("open", ""); }
    }
    const handle = () => close.current();
    dialog.addEventListener("close", handle);
    return () => { dialog.removeEventListener("close", handle); if (dialog.open) dialog.close(); };
  }, []);
  return ref;
}

function Dialog({ title, onClose, children, className = "" }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useModal(onClose);
  return <dialog ref={ref} className={`rw-dialog ${className}`} aria-labelledby="rw-dialog-title">
    <div className="rw-dialog-head"><h2 id="rw-dialog-title">{title}</h2><button type="button" className="rw-icon" onClick={() => ref.current?.close()} aria-label="Close"><X size={22} aria-hidden="true" /></button></div>
    {children}
  </dialog>;
}

type CodeState = { text: string; kind: CodeKind; format?: string } | null;

function ReturnForm({ t, locale, today, items, initial, onClose, onSaved }: { t: T; locale: string; today: string; items: ReturnItem[]; initial: ReturnItem | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [code, setCode] = useState<CodeState>(initial?.code ? { text: initial.code, kind: initial.codeKind, format: initial.barcode } : null);
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const image = shot?.blob ?? null;
  const previewUrl = shot?.url ?? "";
  const [keepImage, setKeepImage] = useState(initial?.hasImage ?? false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState(initial?.code ?? "");
  const [manualKind, setManualKind] = useState<"qr" | "number">(initial?.codeKind === "number" ? "number" : "qr");
  const [camera, setCamera] = useState(false);
  const [store, setStore] = useState(initial?.store ?? "");
  const [product, setProduct] = useState(initial?.product ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount).replace(".", locale === "sv" ? "," : ".") : "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? (locale === "sv" ? "SEK" : "EUR"));
  const [method, setMethod] = useState(initial?.method ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);
  const setImage = (blob: Blob | null) => setShot(blob ? { blob, url: URL.createObjectURL(blob) } : null);

  function accept(found: DecodedCode | null, fromImage: boolean) {
    if (found) {
      setCode({ text: found.text, kind: found.kind, format: found.format });
      setManual(false);
      setStatus(found.kind === "qr" ? t("QR code found. It will be shown as a crisp, full-screen code.", "QR-kod hittad. Den visas skarp i helskärm.") : t("Barcode found. The original screenshot is kept for the scanner.", "Streckkod hittad. Originalbilden sparas för skannern."));
    } else if (fromImage) {
      setStatus(t("No QR code found in that image. The screenshot is kept, so you can still show it at the counter.", "Ingen QR-kod hittades i bilden. Skärmdumpen sparas så att du ändå kan visa den vid disken."));
    }
  }

  async function processImage(file: Blob) {
    setBusy(true); setError(""); setStatus(t("Reading the code on this device…", "Läser koden på enheten…"));
    try {
      const [found, small] = await Promise.all([decodeImageFile(file), shrinkImage(file)]);
      setImage(small); setKeepImage(true);
      accept(found, true);
    } catch (e) {
      setStatus(""); setError(e instanceof Error ? e.message : t("That image could not be read.", "Bilden kunde inte läsas."));
    } finally { setBusy(false); }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) await processImage(file);
  }

  async function pasteFromClipboard() {
    setError("");
    try {
      if (navigator.clipboard?.read) {
        const entries = await navigator.clipboard.read();
        for (const entry of entries) {
          const type = entry.types.find(value => value.startsWith("image/"));
          if (type) { await processImage(await entry.getType(type)); return; }
        }
        for (const entry of entries) {
          if (entry.types.includes("text/plain")) { takeText(await (await entry.getType("text/plain")).text()); return; }
        }
      } else if (navigator.clipboard?.readText) { takeText(await navigator.clipboard.readText()); return; }
      setError(t("Nothing to paste. Copy the QR image or the return link first.", "Inget att klistra in. Kopiera QR-bilden eller returlänken först."));
    } catch {
      setManual(true);
      setError(t("Paste was blocked. Long-press in the box below and choose Paste.", "Inklistring blockerades. Håll inne i rutan nedan och välj Klistra in."));
    }
  }

  function takeText(text: string) {
    if (!text.trim()) { setError(t("The clipboard is empty.", "Urklipp är tomt.")); return; }
    setManual(true); setManualText(text.slice(0, RETURN_CODE_MAX));
    setManualKind(/^\s*https?:\/\//i.test(text) || text.length > 24 ? "qr" : "number");
  }

  function onPaste(event: ClipboardEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea")) return;
    const file = Array.from(event.clipboardData.files).find(item => item.type.startsWith("image/"));
    if (file) { event.preventDefault(); void processImage(file); return; }
    const text = event.clipboardData.getData("text/plain");
    if (text) { event.preventDefault(); takeText(text); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) { setError(t("Write the amount as a number, e.g. 699 or 699,50.", "Skriv beloppet som en siffra, t.ex. 699 eller 699,50.")); return; }
    const finalCode: CodeState = manual ? (manualText.trim() ? { text: manualText, kind: manualKind } : null) : code;
    if (finalCode && finalCode.text.length > RETURN_CODE_MAX) { setError(t("That code is too long to store.", "Koden är för lång för att sparas.")); return; }
    const duplicate = findDuplicate(items, finalCode?.text, initial?.id);
    if (duplicate) { setError(t(`This return code is already in your wallet (${duplicate.store}).`, `Den här returkoden finns redan i plånboken (${duplicate.store}).`)); return; }
    const hasImage = Boolean(image) || (keepImage && Boolean(initial?.hasImage));
    const draft: ReturnDraft = {
      store, product, deadline: deadline || undefined, method, note,
      ...(parsedAmount !== undefined ? { amount: parsedAmount, currency } : {}),
      code: finalCode?.text, codeKind: finalCode ? finalCode.kind : "none", barcode: finalCode?.format, hasImage
    };
    let item: ReturnItem;
    try { item = initial ? updateReturn(initial, draft) : createReturn(draft); }
    catch { setError(t("Add the store name. Check the date and amount.", "Ange butiken. Kontrollera datum och belopp.")); return; }
    if (!initial && items.length >= RETURNS_LIMIT) { setError(writeError({ ok: false, reason: "full" }, t)); return; }
    let imageSaved = true;
    if (image) imageSaved = await saveReturnImage(item.id, image);
    if (!imageSaved) item = { ...item, hasImage: false };
    if (initial?.hasImage && !item.hasImage) await deleteReturnImage(item.id);
    const result = writeReturns(initial ? items.map(existing => (existing.id === item.id ? item : existing)) : [item, ...items]);
    if (!result.ok) { setError(writeError(result, t)); if (image && !initial) await deleteReturnImage(item.id); return; }
    if (!initial) measure("return_added", "returns");
    onSaved(initial ? t("Return updated.", "Returen är uppdaterad.") : imageSaved ? t(`${item.store} saved. Tap “Show return QR” at the counter.`, `${item.store} sparad. Tryck ”Visa retur-QR” vid disken.`) : t("Saved, but this browser would not keep the screenshot. The decoded code is saved.", "Sparad, men webbläsaren sparade inte skärmdumpen. Den avlästa koden är sparad."));
  }

  const hasAnyCode = Boolean(code) || Boolean(image) || (keepImage && initial?.hasImage) || (manual && manualText.trim());

  return <Dialog title={initial ? t("Edit return", "Ändra retur") : t("Add a return", "Lägg till retur")} onClose={onClose} className="rw-form-dialog">
    <form onSubmit={submit} onPaste={onPaste} className="rw-form" noValidate>
      <fieldset className="rw-code-step" disabled={busy}>
        <legend>{t("1. The return code", "1. Returkoden")}</legend>
        {code && !manual ? <div className="rw-code-found" role="status">
          <Check size={20} aria-hidden="true" />
          <div><strong>{code.kind === "qr" ? t("QR code ready", "QR-kod klar") : t("Code ready", "Kod klar")}</strong><code>{code.text.length > 80 ? `${code.text.slice(0, 80)}…` : code.text}</code></div>
          <button type="button" className="rw-link-button" onClick={() => { setCode(null); setImage(null); setKeepImage(false); setStatus(""); }}>{t("Replace", "Byt")}</button>
        </div> : <>
          <div className="rw-inputs">
            <button type="button" className="rw-input primary" onClick={() => fileRef.current?.click()}><Upload size={22} aria-hidden="true" /><span>{t("Choose screenshot", "Välj skärmdump")}</span></button>
            <button type="button" className="rw-input" onClick={() => void pasteFromClipboard()}><ClipboardPaste size={22} aria-hidden="true" /><span>{t("Paste", "Klistra in")}</span></button>
            <button type="button" className="rw-input" onClick={() => { setCamera(true); setError(""); }}><Camera size={22} aria-hidden="true" /><span>{t("Scan with camera", "Skanna med kameran")}</span></button>
            <button type="button" className="rw-input" onClick={() => setManual(value => !value)} aria-expanded={manual}><Type size={22} aria-hidden="true" /><span>{t("Type the code", "Skriv koden")}</span></button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
          {camera && <CameraScanner t={t} onClose={() => setCamera(false)} onCode={found => { setCamera(false); accept(found, false); }} />}
          {manual && <div className="rw-manual">
            <label htmlFor="rw-code">{t("Return code, link or number", "Returkod, länk eller nummer")}</label>
            <textarea id="rw-code" value={manualText} maxLength={RETURN_CODE_MAX} rows={3} onChange={e => setManualText(e.target.value)} placeholder={t("Paste the link behind the QR, or type the return number", "Klistra in länken bakom QR-koden eller skriv returnumret")} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            <div className="rw-radio" role="radiogroup" aria-label={t("Show it as", "Visa som")}>
              <label><input type="radio" name="kind" checked={manualKind === "qr"} onChange={() => setManualKind("qr")} /> {t("Show as QR code", "Visa som QR-kod")}</label>
              <label><input type="radio" name="kind" checked={manualKind === "number"} onChange={() => setManualKind("number")} /> {t("Show as number", "Visa som nummer")}</label>
            </div>
          </div>}
        </>}
        {previewUrl && <figure className="rw-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={t("Your screenshot, stored on this device", "Din skärmdump, sparad på enheten")} />
          <figcaption>{t("Kept on this device as a backup.", "Sparas på enheten som reserv.")} <button type="button" className="rw-link-button" onClick={() => { setImage(null); setKeepImage(false); }}>{t("Remove", "Ta bort")}</button></figcaption>
        </figure>}
        {!image && keepImage && initial?.hasImage && <p className="rw-hint">{t("The original screenshot is saved.", "Originalskärmdumpen är sparad.")} <button type="button" className="rw-link-button" onClick={() => setKeepImage(false)}>{t("Remove it", "Ta bort den")}</button></p>}
        <p className="rw-hint" role="status" aria-live="polite">{busy ? t("Reading…", "Läser…") : status || (!hasAnyCode ? t("No code yet? You can still save it and add the code later.", "Ingen kod än? Spara ändå och lägg till koden senare.") : "")}</p>
      </fieldset>

      <fieldset className="rw-details">
        <legend>{t("2. What is going back", "2. Vad ska tillbaka")}</legend>
        <label className="rw-field">{t("Store", "Butik")}<input value={store} onChange={e => setStore(e.target.value)} list="rw-stores" maxLength={60} required autoComplete="off" placeholder="Zalando" enterKeyHint="next" /></label>
        <datalist id="rw-stores">{stores.map(value => <option key={value} value={value} />)}</datalist>
        <label className="rw-field">{t("Item or order (optional)", "Vara eller order (valfritt)")}<input value={product} onChange={e => setProduct(e.target.value)} maxLength={80} autoComplete="off" placeholder={t("Nike Air Max, size 42", "Nike Air Max, stl 42")} enterKeyHint="next" /></label>
        <div className="rw-field">
          <label htmlFor="rw-deadline">{t("Return by (optional)", "Returnera senast (valfritt)")}</label>
          <input id="rw-deadline" type="date" value={deadline} min={initial ? undefined : addDays(today, -60)} onChange={e => setDeadline(e.target.value)} />
          <div className="rw-quick" aria-label={t("Quick dates", "Snabbval")}>{[14, 30, 100].map(days => <button type="button" key={days} onClick={() => setDeadline(addDays(today, days))}>+{days} {t("days", "dagar")}</button>)}{deadline && <button type="button" onClick={() => setDeadline("")}>{t("No date", "Inget datum")}</button>}</div>
        </div>
        <div className="rw-row">
          <label className="rw-field">{t("Refund amount (optional)", "Belopp (valfritt)")}<input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" autoComplete="off" placeholder="699" maxLength={14} /></label>
          <label className="rw-field rw-currency">{t("Currency", "Valuta")}<select value={currency} onChange={e => setCurrency(e.target.value as Currency)}>{currencies.map(value => <option key={value}>{value}</option>)}</select></label>
        </div>
        <details className="rw-extra" open={Boolean(initial?.method || initial?.note)}>
          <summary>{t("Drop-off and note", "Inlämning och anteckning")}</summary>
          <label className="rw-field">{t("Drop-off / carrier", "Inlämning / transportör")}<input value={method} onChange={e => setMethod(e.target.value)} list="rw-methods" maxLength={60} autoComplete="off" placeholder="PostNord" /></label>
          <datalist id="rw-methods">{methods.map(value => <option key={value} value={value} />)}</datalist>
          <label className="rw-field">{t("Note", "Anteckning")}<textarea value={note} onChange={e => setNote(e.target.value)} maxLength={240} rows={2} placeholder={t("Wrong size. Keep the original bag.", "Fel storlek. Spara originalpåsen.")} /></label>
        </details>
      </fieldset>
      {error && <p className="rw-error" role="alert">{error}</p>}
      <div className="rw-form-actions">
        <button type="submit" className="primary-button" disabled={busy || !store.trim()}>{initial ? t("Save changes", "Spara ändringar") : t("Save return", "Spara retur")} <Check size={18} aria-hidden="true" /></button>
        <p className="rw-hint"><ShieldCheck size={14} aria-hidden="true" /> {t("Stays on this device. StayTag never sees the code, store or amount.", "Stannar på enheten. StayTag ser aldrig koden, butiken eller beloppet.")}</p>
      </div>
    </form>
  </Dialog>;
}

function CameraScanner({ t, onClose, onCode }: { t: T; onClose: () => void; onCode: (code: DecodedCode) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const done = useRef(onCode);
  useEffect(() => { done.current = onCode; });
  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    if (video.current) {
      startCameraScan(video.current, code => done.current(code))
        .then(fn => { if (cancelled) fn(); else stop = fn; })
        .catch(e => setError(e instanceof Error && e.name === "NotAllowedError" ? t("Camera access was denied. Use a screenshot instead.", "Kameran nekades. Använd en skärmdump i stället.") : t("The camera could not start. Use a screenshot instead.", "Kameran kunde inte starta. Använd en skärmdump i stället.")));
    }
    return () => { cancelled = true; stop?.(); };
  }, [t]);
  return <div className="rw-camera">
    <video ref={video} playsInline muted aria-label={t("Camera view", "Kameravy")} />
    <p role="status">{error || t("Point the camera at the return QR.", "Rikta kameran mot retur-QR:en.")}</p>
    <button type="button" className="secondary-button" onClick={onClose}>{t("Stop camera", "Stäng kameran")}</button>
  </div>;
}

function CodeView({ t, locale, today, item, sample, onClose, onDropped }: { t: T; locale: string; today: string; item: ReturnItem; sample: boolean; onClose: () => void; onDropped?: () => void }) {
  const ref = useModal(onClose);
  const [qr, setQr] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [original, setOriginal] = useState(item.codeKind === "none");
  const countdown = countdownText(item, today, locale, t);

  useEffect(() => {
    if (item.codeKind !== "qr" || !item.code) return;
    let live = true;
    QRCode.toDataURL(item.code, { errorCorrectionLevel: "M", margin: 4, width: 1024, color: { dark: "#000000", light: "#ffffff" } })
      .then(url => { if (live) setQr(url); })
      .catch(() => { if (live) setOriginal(true); });
    return () => { live = false; };
  }, [item.code, item.codeKind]);

  useEffect(() => {
    if (!item.hasImage || sample) return;
    let url = "";
    let live = true;
    loadReturnImage(item.id).then(blob => { if (blob && live) { url = URL.createObjectURL(blob); setImageUrl(url); } });
    return () => { live = false; if (url) URL.revokeObjectURL(url); };
  }, [item.hasImage, item.id, sample]);

  useEffect(() => {
    let lock: { release(): Promise<void> } | undefined;
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } };
    nav.wakeLock?.request("screen").then(value => { lock = value; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, []);

  const showImage = (original || item.codeKind === "number") && imageUrl;
  return <dialog ref={ref} className="rw-code-view" aria-labelledby="rw-code-title">
    <div className="rw-code-top">
      <button type="button" className="rw-back" onClick={() => ref.current?.close()}><ArrowLeft size={22} aria-hidden="true" /> {t("Back", "Tillbaka")}</button>
      {sample && <span className="rw-chip calm">{t("Example — not a real code", "Exempel — ingen riktig kod")}</span>}
    </div>
    <div className="rw-code-body">
      <p className="rw-code-store" id="rw-code-title">{item.store}{item.product ? <span>{item.product}</span> : null}</p>
      {item.codeKind === "qr" && qr && !original && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rw-code-qr" src={qr} alt={t(`Return QR code for ${item.store}`, `Retur-QR för ${item.store}`)} />
      </>}
      {item.codeKind === "number" && item.code && <p className="rw-code-number" aria-label={t("Return number", "Returnummer")}>{item.code}</p>}
      {showImage && <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rw-code-image" src={imageUrl} alt={t("Original return screenshot", "Original skärmdump av returen")} />
      </>}
      {item.codeKind === "none" && !imageUrl && <p className="rw-hint">{t("No code saved for this return.", "Ingen kod sparad för returen.")}</p>}
      {item.codeKind === "qr" && imageUrl && <button type="button" className="rw-link-button" onClick={() => setOriginal(value => !value)}>{original ? t("Show sharp QR", "Visa skarp QR") : t("Show original screenshot", "Visa originalskärmdump")}</button>}
      <p className="rw-code-meta">{[countdown?.text, item.method].filter(Boolean).join(" · ")}</p>
      <p className="rw-bright">{t("Turn screen brightness up if the scanner struggles.", "Skruva upp ljusstyrkan om skannern har svårt.")}</p>
    </div>
    <div className="rw-code-actions">
      {onDropped && <button type="button" className="primary-button" onClick={onDropped}><Check size={20} aria-hidden="true" /> {t("Mark as dropped off", "Markera som inlämnad")}</button>}
      {sample && <p className="rw-hint">{t("Your real returns open exactly like this.", "Dina riktiga returer öppnas precis så här.")}</p>}
    </div>
  </dialog>;
}

function ReminderDialog({ t, item, today, onClose, onDone }: { t: T; item: ReturnItem; today: string; onClose: () => void; onDone: (text: string) => void }) {
  const days = item.deadline ? dayDiff(today, item.deadline) : 0;
  const options: ReminderOffset[] = [...reminderOffsets.filter(offset => offset < days), ...(days >= 0 ? [0 as ReminderOffset] : [])];
  const [chosen, setChosen] = useState<ReminderOffset[]>(options.filter(offset => offset === 3 || offset === 1 || (options.length === 1 && offset === 0)));
  function download() {
    const ics = createReturnIcs(item, chosen, sampleWalletUrl);
    const href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    triggerDownload(href, "staytag-return-reminder.ics");
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
    measure("return_reminder_added", "returns");
    onDone(t("Calendar file downloaded. Open it to add the reminder.", "Kalenderfilen är nedladdad. Öppna den för att lägga till påminnelsen."));
  }
  const label = (offset: ReminderOffset) => (offset === 0 ? t("On the day, 09:00", "Samma dag kl. 09") : offset === 1 ? t("The day before", "Dagen innan") : t(`${offset} days before`, `${offset} dagar innan`));
  return <Dialog title={t("Remind me before it expires", "Påminn mig innan fristen går ut")} onClose={onClose}>
    <div className="rw-reminder">
      <p>{t("Adds one event on the last return day to your calendar, with alerts. The return code is not included.", "Lägger in en händelse på sista returdagen i kalendern, med aviseringar. Returkoden följer inte med.")}</p>
      {options.length ? <fieldset><legend className="sr-only">{t("Alerts", "Aviseringar")}</legend>{options.map(offset => <label key={offset}><input type="checkbox" checked={chosen.includes(offset)} onChange={e => setChosen(current => (e.target.checked ? [...current, offset] : current.filter(value => value !== offset)))} /> {label(offset)}</label>)}</fieldset>
        : <p>{t("The return window has already passed.", "Returfristen har redan gått ut.")}</p>}
      <button type="button" className="primary-button" disabled={!chosen.length} onClick={download}><Bell size={18} aria-hidden="true" /> {t("Add to calendar", "Lägg till i kalendern")}</button>
    </div>
  </Dialog>;
}

function DamagedBanner({ t, onReset }: { t: T; onReset: () => void }) {
  return <section className="rw-notice error" role="alert"><div><strong>{t("Your saved returns could not be read.", "Dina sparade returer kunde inte läsas.")}</strong> {t("Nothing has been changed. If you have a backup, reset and import it.", "Inget har ändrats. Har du en säkerhetskopia kan du återställa och importera den.")}</div><button type="button" className="secondary-button" onClick={onReset}>{t("Reset Return Wallet", "Återställ returplånboken")}</button></section>;
}

function HowItWorks({ t }: { t: T }) {
  return <section className="rw-how" aria-labelledby="rw-how-title">
    <h2 id="rw-how-title">{t("Why this beats a screenshot folder", "Varför det slår en mapp med skärmdumpar")}</h2>
    <div className="rw-how-grid">
      <article><h3>{t("Found in one tap", "Hittas med ett tryck")}</h3><p>{t("No digging through email or 8,000 photos while the queue waits.", "Inget letande i mejl eller bland 8 000 bilder medan kön väntar.")}</p></article>
      <article><h3>{t("Knows the deadline", "Håller koll på fristen")}</h3><p>{t("“2 days left” before the return window closes. Calendar alerts if you want them.", "”2 dagar kvar” innan returfristen stänger. Kalenderaviseringar om du vill.")}</p></article>
      <article><h3>{t("Follows the money", "Följer pengarna")}</h3><p>{t("Dropped off, refund pending, refunded. See what is still owed to you.", "Inlämnad, väntar, återbetald. Se vad du fortfarande har att få.")}</p></article>
      <article><h3>{t("Private by design", "Privat från början")}</h3><p>{t("No account. Codes and screenshots stay in this browser. We only count that a return was added.", "Inget konto. Koder och skärmdumpar stannar i webbläsaren. Vi räknar bara att en retur lades till.")}</p></article>
    </div>
    <p className="rw-tip">{t("Tip: add this page to your Home Screen (Share → Add to Home Screen) to open your returns in one tap at the counter.", "Tips: lägg sidan på hemskärmen (Dela → Lägg till på hemskärmen) så öppnar du returerna med ett tryck vid disken.")}</p>
  </section>;
}

function DataPanel({ t, items, onNotice, damaged }: { t: T; items: ReturnItem[]; onNotice: (notice: Notice) => void; damaged: boolean }) {
  const importRef = useRef<HTMLInputElement>(null);
  async function exportBackup() {
    const images: Record<string, string> = {};
    for (const item of items) {
      if (!item.hasImage) continue;
      const blob = await loadReturnImage(item.id);
      if (blob) images[item.id] = await blobToDataUrl(blob);
    }
    const href = URL.createObjectURL(new Blob([buildBackup(items, images)], { type: "application/json" }));
    triggerDownload(href, `staytag-returns-${localToday()}.json`);
    window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
    onNotice({ tone: "ok", text: t("Backup downloaded. It contains your return codes — keep it private.", "Säkerhetskopian är nedladdad. Den innehåller dina returkoder — håll den privat.") });
  }
  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const merged = mergeBackup(items, await file.text());
      for (const [id, data] of Object.entries(merged.images)) {
        try { await saveReturnImage(id, await dataUrlToBlob(data)); } catch { /* image skipped */ }
      }
      const result = writeReturns(merged.items);
      if (!result.ok) { onNotice({ tone: "error", text: writeError(result, t) }); return; }
      onNotice({ tone: "ok", text: t(`${merged.added} return(s) imported${merged.skipped ? `, ${merged.skipped} skipped` : ""}.`, `${merged.added} returer importerade${merged.skipped ? `, ${merged.skipped} hoppades över` : ""}.`) });
    } catch (e) { onNotice({ tone: "error", text: e instanceof Error ? e.message : t("Import failed.", "Importen misslyckades.") }); }
  }
  async function clearAll() {
    if (!window.confirm(t("Delete every return and screenshot from this device?", "Radera alla returer och skärmdumpar från enheten?"))) return;
    const result = writeReturns([], undefined, { overwriteDamaged: true });
    if (!result.ok) { onNotice({ tone: "error", text: writeError(result, t) }); return; }
    await clearReturnImages();
    onNotice({ tone: "ok", text: t("Everything deleted from this device.", "Allt är raderat från enheten.") });
  }
  return <details className="rw-data">
    <summary><ShieldCheck size={18} aria-hidden="true" /> {t("What is saved, and where", "Vad sparas, och var")}</summary>
    <ul>
      <li>{t("Store, item, dates, amount, note and the return code are saved in this browser’s local storage. Screenshots are saved in this browser’s IndexedDB.", "Butik, vara, datum, belopp, anteckning och returkod sparas i webbläsarens lokala lagring. Skärmdumpar sparas i webbläsarens IndexedDB.")}</li>
      <li>{t("Nothing is uploaded. Images are decoded on this device. There is no account and no StayTag copy.", "Inget laddas upp. Bilder avkodas på enheten. Det finns inget konto och ingen kopia hos StayTag.")}</li>
      <li>{t("StayTag counts anonymous actions such as “return added”. Never the store, item, code, link or amount.", "StayTag räknar anonyma handlingar som ”retur tillagd”. Aldrig butik, vara, kod, länk eller belopp.")}</li>
      <li>{t("A link inside a return code is never opened automatically.", "En länk i en returkod öppnas aldrig automatiskt.")}</li>
      <li>{t("Clearing site data or switching phone removes the wallet. Export a backup to move it.", "Rensar du webbplatsdata eller byter telefon försvinner plånboken. Exportera en säkerhetskopia för att flytta den.")}</li>
    </ul>
    <div className="rw-data-actions">
      <button type="button" className="secondary-button" onClick={() => void exportBackup()} disabled={!items.length}><Download size={18} aria-hidden="true" /> {t("Export backup", "Exportera säkerhetskopia")}</button>
      <button type="button" className="secondary-button" onClick={() => importRef.current?.click()} disabled={damaged}><Upload size={18} aria-hidden="true" /> {t("Import backup", "Importera säkerhetskopia")}</button>
      <button type="button" className="secondary-button" onClick={() => void clearAll()} disabled={!items.length && !damaged}><Trash2 size={18} aria-hidden="true" /> {t("Delete everything", "Radera allt")}</button>
      <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={e => void importBackup(e)} />
    </div>
  </details>;
}
