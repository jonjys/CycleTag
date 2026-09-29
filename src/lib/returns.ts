/**
 * Return Wallet: return codes and deadlines kept only in this browser.
 * Nothing here is sent to a server. Code contents are shown, never executed or followed automatically.
 */
import { validIsoDay } from "./tag";

export const RETURNS_KEY = "staytag.returns.v1";
export const RETURNS_LIMIT = 60;
export const RETURN_CODE_MAX = 2000;
export const RETURNS_EVENT = "staytag:returns";

export const returnStatuses = ["ready", "dropped", "pending", "refunded", "kept"] as const;
export type ReturnStatus = (typeof returnStatuses)[number];
export const activeStatuses: readonly ReturnStatus[] = ["ready", "dropped", "pending"];
export const lifecycle: readonly ReturnStatus[] = ["ready", "dropped", "pending", "refunded"];

export const currencies = ["SEK", "EUR", "NOK", "DKK", "GBP", "USD"] as const;
export type Currency = (typeof currencies)[number];

export type CodeKind = "qr" | "number" | "none";

export type ReturnItem = {
  v: 1;
  id: string;
  store: string;
  product?: string;
  deadline?: string;
  amount?: number;
  currency?: Currency;
  code?: string;
  codeKind: CodeKind;
  /** A 1D barcode format reported by the browser, e.g. code_128. Display only. */
  barcode?: string;
  hasImage: boolean;
  method?: string;
  note?: string;
  status: ReturnStatus;
  createdAt: string;
  droppedAt?: string;
  refundedAt?: string;
};

export type ReturnDraft = Omit<ReturnItem, "v" | "id" | "status" | "createdAt" | "droppedAt" | "refundedAt"> & { status?: ReturnStatus };

export type ReturnsState = { items: ReturnItem[]; damaged: boolean; skipped: number };

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function cleanText(value: unknown, max: number): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length <= max ? text : null;
}

/** The code is kept byte-for-byte so a regenerated QR scans exactly like the original. */
export function validCode(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > RETURN_CODE_MAX || value.includes("\u0000")) return null;
  return value.trim() ? value : undefined;
}

const isoTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;

export function validateReturn(input: unknown): ReturnItem | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const store = cleanText(raw.store, 60);
  const product = cleanText(raw.product, 80);
  const method = cleanText(raw.method, 60);
  const note = cleanText(raw.note, 240);
  const code = validCode(raw.code);
  const barcode = cleanText(raw.barcode, 24);
  if (raw.v !== 1 || typeof raw.id !== "string" || !/^[a-z0-9]{8,32}$/.test(raw.id)) return null;
  if (!store || product === null || method === null || note === null || code === null || barcode === null) return null;
  if (!returnStatuses.includes(raw.status as ReturnStatus)) return null;
  if (!["qr", "number", "none"].includes(raw.codeKind as string)) return null;
  if (raw.codeKind !== "none" && !code) return null;
  if (typeof raw.hasImage !== "boolean") return null;
  if (typeof raw.createdAt !== "string" || !isoTimestamp.test(raw.createdAt) || Number.isNaN(Date.parse(raw.createdAt))) return null;
  for (const key of ["deadline", "droppedAt", "refundedAt"] as const) {
    if (raw[key] !== undefined && (typeof raw[key] !== "string" || !validIsoDay(raw[key] as string))) return null;
  }
  let amount: number | undefined;
  let currency: Currency | undefined;
  if (raw.amount !== undefined) {
    if (typeof raw.amount !== "number" || !Number.isFinite(raw.amount) || raw.amount < 0 || raw.amount > 10_000_000) return null;
    if (!currencies.includes(raw.currency as Currency)) return null;
    amount = Math.round(raw.amount * 100) / 100;
    currency = raw.currency as Currency;
  }
  return {
    v: 1,
    id: raw.id,
    store,
    ...(product ? { product } : {}),
    ...(raw.deadline ? { deadline: raw.deadline as string } : {}),
    ...(amount !== undefined ? { amount, currency } : {}),
    ...(code && raw.codeKind !== "none" ? { code } : {}),
    codeKind: code ? (raw.codeKind as CodeKind) : "none",
    ...(barcode ? { barcode } : {}),
    hasImage: raw.hasImage,
    ...(method ? { method } : {}),
    ...(note ? { note } : {}),
    status: raw.status as ReturnStatus,
    createdAt: raw.createdAt,
    ...(raw.droppedAt ? { droppedAt: raw.droppedAt as string } : {}),
    ...(raw.refundedAt ? { refundedAt: raw.refundedAt as string } : {})
  };
}

/** Parse stored data. One bad entry never wipes the rest; unreadable JSON is reported, not overwritten. */
export function parseReturns(raw: string | null): ReturnsState {
  if (raw === null) return { items: [], damaged: false, skipped: 0 };
  if (raw.length > 4_000_000) return { items: [], damaged: true, skipped: 0 };
  let data: unknown;
  try { data = JSON.parse(raw); } catch { return { items: [], damaged: true, skipped: 0 }; }
  if (!data || typeof data !== "object" || (data as { v?: unknown }).v !== 1 || !Array.isArray((data as { items?: unknown }).items)) {
    return { items: [], damaged: true, skipped: 0 };
  }
  const items: ReturnItem[] = [];
  let skipped = 0;
  for (const entry of (data as { items: unknown[] }).items.slice(0, RETURNS_LIMIT)) {
    const item = validateReturn(entry);
    if (!item || items.some(existing => existing.id === item.id)) { skipped += 1; continue; }
    items.push(item);
  }
  return { items, damaged: false, skipped };
}

export function serializeReturns(items: ReturnItem[]): string {
  return JSON.stringify({ v: 1, items: items.slice(0, RETURNS_LIMIT) });
}

export function newReturnId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function createReturn(draft: ReturnDraft, now = new Date(), id = newReturnId()): ReturnItem {
  const item = validateReturn({ ...draft, v: 1, id, status: draft.status ?? "ready", createdAt: now.toISOString() });
  if (!item) throw new Error("Check the store name, date, amount and code.");
  return item;
}

export function updateReturn(item: ReturnItem, draft: ReturnDraft): ReturnItem {
  const next = validateReturn({ ...item, ...draft, status: item.status, v: 1, id: item.id, createdAt: item.createdAt, droppedAt: item.droppedAt, refundedAt: item.refundedAt });
  if (!next) throw new Error("Check the store name, date, amount and code.");
  return next;
}

/** Same non-empty code already active in the wallet. */
export function findDuplicate(items: ReturnItem[], code: string | undefined, exceptId?: string): ReturnItem | undefined {
  if (!code) return undefined;
  const key = code.trim();
  return items.find(item => item.id !== exceptId && item.code?.trim() === key && activeStatuses.includes(item.status));
}

export function nextStatus(status: ReturnStatus): ReturnStatus | null {
  const index = lifecycle.indexOf(status);
  return index >= 0 && index < lifecycle.length - 1 ? lifecycle[index + 1] : null;
}

export function previousStatus(status: ReturnStatus): ReturnStatus | null {
  if (status === "kept") return "ready";
  const index = lifecycle.indexOf(status);
  return index > 0 ? lifecycle[index - 1] : null;
}

export function transition(item: ReturnItem, to: ReturnStatus, today: string): ReturnItem {
  if (!returnStatuses.includes(to) || !validIsoDay(today)) throw new Error("Unknown return status.");
  const order = (status: ReturnStatus) => (status === "kept" ? -1 : lifecycle.indexOf(status));
  const next: ReturnItem = { ...item, status: to };
  if (order(to) >= order("dropped")) next.droppedAt = item.droppedAt ?? today;
  else delete next.droppedAt;
  if (to === "refunded") next.refundedAt = item.refundedAt ?? today;
  else delete next.refundedAt;
  return next;
}

export function isActive(item: Pick<ReturnItem, "status">): boolean {
  return activeStatuses.includes(item.status);
}

export function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type Countdown = { days: number; tone: "overdue" | "today" | "urgent" | "soon" | "calm" };

export function returnCountdown(deadline: string | undefined, today: string): Countdown | null {
  if (!deadline || !validIsoDay(deadline) || !validIsoDay(today)) return null;
  const days = dayDiff(today, deadline);
  return { days, tone: days < 0 ? "overdue" : days === 0 ? "today" : days <= 2 ? "urgent" : days <= 7 ? "soon" : "calm" };
}

/** Active returns first by urgency: ready with the closest deadline, then undated ready, then in transit. */
export function sortReturns(items: ReturnItem[]): ReturnItem[] {
  const rank = (item: ReturnItem) => (item.status === "ready" ? 0 : item.status === "dropped" ? 1 : item.status === "pending" ? 2 : 3);
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r) return r;
    if (a.status === "ready") {
      if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
      if (a.deadline !== b.deadline) return a.deadline ? -1 : 1;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/** Money still on its way back, per currency. Refunded and kept items are excluded. */
export function pendingTotals(items: ReturnItem[]): { currency: Currency; amount: number }[] {
  const totals = new Map<Currency, number>();
  for (const item of items) {
    if (!isActive(item) || item.amount === undefined || !item.currency) continue;
    totals.set(item.currency, Math.round(((totals.get(item.currency) ?? 0) + item.amount) * 100) / 100);
  }
  return [...totals].map(([currency, amount]) => ({ currency, amount }));
}

/** Accepts "699", "699,50", "1 299.00", "1.299,00". Returns null for anything else. */
export function parseAmount(value: string): number | null | undefined {
  const text = value.replace(/[\s\u00a0]/g, "").replace(/(kr|sek|eur|€|\$|£|nok|dkk|usd|gbp)$/i, "");
  if (!text) return undefined;
  if (!/^\d{1,3}([.,]?\d{3})*([.,]\d{1,2})?$|^\d+([.,]\d{1,2})?$/.test(text)) return null;
  const lastSep = Math.max(text.lastIndexOf(","), text.lastIndexOf("."));
  const decimals = lastSep >= 0 && text.length - lastSep - 1 <= 2 ? text.slice(lastSep + 1) : "";
  const whole = (decimals ? text.slice(0, lastSep) : text).replace(/[.,]/g, "");
  const amount = Number(`${whole}.${decimals || "0"}`);
  return Number.isFinite(amount) && amount <= 10_000_000 ? amount : null;
}

export function formatAmount(amount: number, currency: Currency, locale: string): string {
  try {
    return new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-GB", { style: "currency", currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
  } catch { return `${amount} ${currency}`; }
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * A link inside a return code is only offered as an explicit, user-tapped https link.
 * Credentials, non-https schemes (javascript:, data:, intent:, file:) and local hosts are refused.
 */
export function safeCodeLink(code: string | undefined): string | null {
  if (!code) return null;
  const value = code.trim();
  if (value.length > RETURN_CODE_MAX || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host) || /^[\d.]+$/.test(host) || host.startsWith("[")) return null;
    return url.href;
  } catch { return null; }
}

/** The hostname shown before the user decides to open a link from a return code. */
export function codeLinkHost(code: string | undefined): string | null {
  const link = safeCodeLink(code);
  return link ? new URL(link).hostname.replace(/^www\./, "") : null;
}

// ---------- storage ----------

function browserStore(): Store | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function readReturns(store?: Store): ReturnsState {
  const target = store ?? browserStore();
  if (!target) return { items: [], damaged: false, skipped: 0 };
  try { return parseReturns(target.getItem(RETURNS_KEY)); } catch { return { items: [], damaged: false, skipped: 0 }; }
}

export type WriteResult = { ok: true } | { ok: false; reason: "unavailable" | "quota" | "damaged" | "full" };

export function writeReturns(items: ReturnItem[], store?: Store, options: { overwriteDamaged?: boolean } = {}): WriteResult {
  const target = store ?? browserStore();
  if (!target) return { ok: false, reason: "unavailable" };
  if (items.length > RETURNS_LIMIT) return { ok: false, reason: "full" };
  try {
    if (!options.overwriteDamaged && parseReturns(target.getItem(RETURNS_KEY)).damaged) return { ok: false, reason: "damaged" };
    target.setItem(RETURNS_KEY, serializeReturns(items));
  } catch (error) {
    return { ok: false, reason: error instanceof Error && /quota/i.test(`${error.name} ${error.message}`) ? "quota" : "unavailable" };
  }
  if (!store && typeof window !== "undefined") window.dispatchEvent(new Event(RETURNS_EVENT));
  return { ok: true };
}

export function getReturnsSnapshot(): string | null {
  try { return window.localStorage.getItem(RETURNS_KEY); } catch { return null; }
}
export const getReturnsServerSnapshot = (): string | null | undefined => undefined;
export function subscribeReturns(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === RETURNS_KEY || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(RETURNS_EVENT, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(RETURNS_EVENT, callback); };
}

// ---------- backup ----------

export type ReturnsBackup = { kind: "staytag-returns"; v: 1; exportedAt: string; items: ReturnItem[]; images?: Record<string, string> };

export function buildBackup(items: ReturnItem[], images: Record<string, string> = {}, now = new Date()): string {
  return JSON.stringify({ kind: "staytag-returns", v: 1, exportedAt: now.toISOString(), items, images } satisfies ReturnsBackup);
}

const imageDataUrl = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

/** Merge a backup into the wallet. Existing ids win; invalid entries and non-image data are dropped. */
export function mergeBackup(current: ReturnItem[], text: string): { items: ReturnItem[]; added: number; skipped: number; images: Record<string, string> } {
  if (text.length > 30_000_000) throw new Error("That backup file is too large.");
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("That file is not a StayTag returns backup."); }
  const backup = data as Partial<ReturnsBackup>;
  if (!backup || backup.kind !== "staytag-returns" || backup.v !== 1 || !Array.isArray(backup.items)) throw new Error("That file is not a StayTag returns backup.");
  const items = [...current];
  const images: Record<string, string> = {};
  let added = 0, skipped = 0;
  for (const entry of backup.items) {
    const item = validateReturn(entry);
    if (!item || items.some(existing => existing.id === item.id) || items.length >= RETURNS_LIMIT) { skipped += 1; continue; }
    const image = backup.images && typeof backup.images === "object" ? (backup.images as Record<string, unknown>)[item.id] : undefined;
    const keepImage = typeof image === "string" && image.length < 8_000_000 && imageDataUrl.test(image);
    if (keepImage) images[item.id] = image as string;
    items.push({ ...item, hasImage: item.hasImage && keepImage });
    added += 1;
  }
  return { items, added, skipped, images };
}

// ---------- calendar ----------

function compact(day: string): string { return day.replace(/-/g, ""); }
function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

export const reminderOffsets = [7, 3, 1] as const;
export type ReminderOffset = (typeof reminderOffsets)[number] | 0;

/**
 * One all-day event on the return deadline with alarms at 09:00 local time on the chosen days before it.
 * The return code itself is never written to the calendar file.
 */
export function createReturnIcs(item: ReturnItem, offsets: ReminderOffset[], walletUrl: string, now = new Date()): string {
  if (!item.deadline) throw new Error("Add a return-by date first.");
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = [item.store, item.product].filter(Boolean).join(" – ");
  const alarms = [...new Set(offsets)].sort((a, b) => b - a).flatMap(days => [
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(days === 0 ? `Return today: ${title}` : `Return ${title} within ${days} day${days === 1 ? "" : "s"}`)}`,
    // All-day events start at 00:00; -P2DT15H fires 09:00 three days before, PT9H fires 09:00 on the day.
    `TRIGGER:${days === 0 ? "PT9H" : `-P${days - 1 ? `${days - 1}D` : ""}T15H`}`,
    "END:VALARM"
  ]);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StayTag//Return Wallet//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:staytag-return-${item.id}@cycletag.eu`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(item.deadline)}`,
    `DTEND;VALUE=DATE:${compact(addDays(item.deadline, 1))}`,
    `SUMMARY:${escapeIcs(`Last return day: ${title}`)}`,
    `DESCRIPTION:${escapeIcs(`Your return code is in StayTag Return Wallet on your phone: ${walletUrl}`)}`,
    "TRANSP:TRANSPARENT",
    ...alarms,
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}
