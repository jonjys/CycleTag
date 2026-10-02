/**
 * StayTag Move: QR labels for moving boxes. Each box QR carries its own contents list,
 * so anyone who scans it sees what is inside. The owner's full move lives in this browser.
 */

export const MOVE_KEY = "staytag.move.v1";
export const PASS_KEY = "staytag.move.pass.v1";
export const MOVE_EVENT = "staytag:move";
export const FREE_BOXES = 8;
export const MAX_BOXES = 300;
export const MAX_ITEMS = 40;
export const BOX_MAX_ENCODED = 1400;

export const rooms = ["Kitchen", "Living room", "Bedroom", "Kids' room", "Bathroom", "Office", "Hall", "Storage", "Garage", "Other"] as const;
export const roomsSv: Record<string, string> = { Kitchen: "Kök", "Living room": "Vardagsrum", Bedroom: "Sovrum", "Kids' room": "Barnrum", Bathroom: "Badrum", Office: "Kontor", Hall: "Hall", Storage: "Förråd", Garage: "Garage", Other: "Övrigt" };
/** Colour band per room so helpers can sort boxes without reading. */
export const roomColors: Record<string, string> = { Kitchen: "#e9683b", "Living room": "#2f6fd6", Bedroom: "#7b4bd1", "Kids' room": "#e0b100", Bathroom: "#19a3a3", Office: "#3d8b3d", Hall: "#8a6d4b", Storage: "#6b6b6b", Garage: "#b8322a", Other: "#171713" };

export type Box = { n: number; room: string; items: string[]; fragile: boolean; heavy: boolean; note?: string; unpacked?: boolean };
export type Move = { v: 1; name: string; boxes: Box[] };
/** What a box QR carries. No owner identity, no address. */
export type BoxLabel = { move: string; n: number; room: string; items: string[]; fragile: boolean; heavy: boolean; note?: string };

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text.length <= max ? text : null;
}

/** Split a pasted contents list on new lines, commas or semicolons. */
export function parseItems(text: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const part of text.split(/[\n,;]+/)) {
    const item = clean(part, 200)?.slice(0, 60).trim();
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    items.push(item);
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

export function validateBox(input: unknown): Box | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const room = clean(raw.room, 30);
  const note = raw.note === undefined ? "" : clean(raw.note, 80);
  if (!Number.isInteger(raw.n) || (raw.n as number) < 1 || (raw.n as number) > 999 || !room || note === null) return null;
  if (!Array.isArray(raw.items) || raw.items.length > MAX_ITEMS) return null;
  const items = raw.items.map(item => clean(item, 60)).filter((item): item is string => Boolean(item));
  if (items.length !== raw.items.length) return null;
  if (typeof raw.fragile !== "boolean" || typeof raw.heavy !== "boolean") return null;
  return { n: raw.n as number, room, items, fragile: raw.fragile, heavy: raw.heavy, ...(note ? { note } : {}), ...(raw.unpacked === true ? { unpacked: true } : {}) };
}

export function validateMove(input: unknown): Move | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const name = clean(raw.name, 40);
  if (raw.v !== 1 || name === null || !Array.isArray(raw.boxes) || raw.boxes.length > MAX_BOXES) return null;
  const boxes: Box[] = [];
  for (const entry of raw.boxes) {
    const box = validateBox(entry);
    if (!box || boxes.some(existing => existing.n === box.n)) return null;
    boxes.push(box);
  }
  return { v: 1, name, boxes };
}

export function emptyMove(): Move {
  return { v: 1, name: "My move", boxes: [] };
}

export function nextBoxNumber(move: Move): number {
  return move.boxes.reduce((max, box) => Math.max(max, box.n), 0) + 1;
}

export function upsertBox(move: Move, box: Box): Move {
  const valid = validateBox(box);
  if (!valid) throw new Error("Choose a room and keep each item under 60 characters.");
  const exists = move.boxes.some(existing => existing.n === valid.n);
  if (!exists && move.boxes.length >= MAX_BOXES) throw new Error(`A move holds up to ${MAX_BOXES} boxes.`);
  const boxes = exists ? move.boxes.map(existing => (existing.n === valid.n ? valid : existing)) : [...move.boxes, valid];
  return { ...move, boxes: boxes.sort((a, b) => a.n - b.n) };
}

export function removeBox(move: Move, n: number): Move {
  return { ...move, boxes: move.boxes.filter(box => box.n !== n) };
}

/** Free tier: the first FREE_BOXES boxes can be created and printed. */
export function canAddBox(move: Move, hasPass: boolean): boolean {
  return hasPass || move.boxes.length < FREE_BOXES;
}

function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** "Which box has the kettle?" Matches items, room, note and box number. */
export function searchBoxes(move: Move, query: string): { box: Box; hits: string[] }[] {
  const q = fold(query.trim());
  if (!q) return move.boxes.map(box => ({ box, hits: [] }));
  const results: { box: Box; hits: string[] }[] = [];
  for (const box of move.boxes) {
    const hits = box.items.filter(item => fold(item).includes(q));
    const meta = fold(`${box.room} ${box.note ?? ""}`).includes(q) || String(box.n) === q.replace(/^#/, "");
    if (hits.length || meta) results.push({ box, hits });
  }
  return results;
}

export function moveStats(move: Move): { boxes: number; unpacked: number; fragile: number; items: number; rooms: { room: string; count: number }[] } {
  const roomCounts = new Map<string, number>();
  for (const box of move.boxes) roomCounts.set(box.room, (roomCounts.get(box.room) ?? 0) + 1);
  return {
    boxes: move.boxes.length,
    unpacked: move.boxes.filter(box => box.unpacked).length,
    fragile: move.boxes.filter(box => box.fragile).length,
    items: move.boxes.reduce((sum, box) => sum + box.items.length, 0),
    rooms: [...roomCounts].map(([room, count]) => ({ room, count })).sort((a, b) => b.count - a.count)
  };
}

// ---------- box QR codec ----------

function toBase64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function boxLabel(move: Move, box: Box): BoxLabel {
  return { move: move.name || "My move", n: box.n, room: box.room, items: box.items, fragile: box.fragile, heavy: box.heavy, ...(box.note ? { note: box.note } : {}) };
}

export function encodeBox(label: BoxLabel): string {
  const box = validateBox({ ...label, unpacked: false });
  const move = clean(label.move, 40);
  if (!box || move === null) throw new Error("This box has invalid details.");
  const flags = (box.fragile ? 1 : 0) | (box.heavy ? 2 : 0);
  const encoded = toBase64Url(JSON.stringify([1, move, box.n, box.room, box.items, flags, box.note ?? ""]));
  if (encoded.length > BOX_MAX_ENCODED) throw new Error("Too much text for one reliable label. Shorten item names or split the box.");
  return encoded;
}

export function decodeBox(encoded: string | null): BoxLabel | null {
  if (!encoded || encoded.length > BOX_MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const data: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0))));
    if (!Array.isArray(data) || data.length !== 7 || data[0] !== 1 || !Number.isInteger(data[5]) || data[5] < 0 || data[5] > 3) return null;
    const move = clean(data[1], 40);
    const box = validateBox({ n: data[2], room: data[3], items: data[4], fragile: Boolean(data[5] & 1), heavy: Boolean(data[5] & 2), note: data[6] || undefined });
    if (!box || move === null) return null;
    return { move: move || "Move", n: box.n, room: box.room, items: box.items, fragile: box.fragile, heavy: box.heavy, ...(box.note ? { note: box.note } : {}) };
  } catch { return null; }
}

export function buildBoxUrl(origin: string, label: BoxLabel): string {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("An HTTP origin is required.");
  url.username = ""; url.password = ""; url.pathname = "/box"; url.search = "";
  url.hash = `d=${encodeBox(label)}`;
  return url.toString();
}

// ---------- storage ----------

type Store = Pick<Storage, "getItem" | "setItem">;

function browserStore(): Store | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function parseMove(raw: string | null): { move: Move; damaged: boolean } {
  if (raw === null) return { move: emptyMove(), damaged: false };
  try {
    const move = validateMove(JSON.parse(raw));
    return move ? { move, damaged: false } : { move: emptyMove(), damaged: true };
  } catch { return { move: emptyMove(), damaged: true }; }
}

export function writeMove(move: Move, store?: Store): boolean {
  const valid = validateMove(move);
  const target = store ?? browserStore();
  if (!valid || !target) return false;
  try { target.setItem(MOVE_KEY, JSON.stringify(valid)); } catch { return false; }
  if (!store && typeof window !== "undefined") window.dispatchEvent(new Event(MOVE_EVENT));
  return true;
}

export function getMoveSnapshot(): string | null {
  try { return window.localStorage.getItem(MOVE_KEY); } catch { return null; }
}
export function getPassSnapshot(): string | null {
  try { return window.localStorage.getItem(PASS_KEY); } catch { return null; }
}
export const getServerSnapshot = (): string | null | undefined => undefined;
export function subscribeMove(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === MOVE_KEY || event.key === PASS_KEY || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(MOVE_EVENT, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(MOVE_EVENT, callback); };
}

// ---------- Move Pass ----------

/** Stripe replaces {CHECKOUT_SESSION_ID} with ids like cs_live_… / cs_test_…. */
export function validSessionId(value: string | null): value is string {
  return Boolean(value && /^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(value));
}

export function hasPass(raw: string | null | undefined): boolean {
  return Boolean(readPass(raw)?.verifiedAt);
}

export function savePass(session: string, store?: Store, now = new Date(), verified = false): boolean {
  if (!validSessionId(session)) return false;
  const target = store ?? browserStore();
  if (!target) return false;
  // An interrupted check must never downgrade a previously verified pass.
  try {
    if (!verified && hasPass(target.getItem(PASS_KEY))) return true;
    target.setItem(PASS_KEY, JSON.stringify({ session, at: now.toISOString(), ...(verified ? { verifiedAt: now.toISOString() } : {}) }));
  } catch { return false; }
  if (!store && typeof window !== "undefined") window.dispatchEvent(new Event(MOVE_EVENT));
  return true;
}

export function readPass(raw: string | null | undefined): { session: string; verifiedAt?: string } | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!validSessionId(data?.session) || typeof data?.at !== "string" || !Number.isFinite(Date.parse(data.at))) return null;
    const verifiedAt = typeof data.verifiedAt === "string" && Number.isFinite(Date.parse(data.verifiedAt)) ? data.verifiedAt : undefined;
    return { session: data.session, ...(verifiedAt ? { verifiedAt } : {}) };
  } catch { return null; }
}

export function removePass(store?: Store): void {
  const target = store ?? browserStore();
  try { (target as Storage | null)?.removeItem?.(PASS_KEY); } catch { /* nothing stored */ }
  if (!store && typeof window !== "undefined") window.dispatchEvent(new Event(MOVE_EVENT));
}

/** Re-check a stored pass at most weekly; unverified passes are re-checked on every visit. */
export function needsRecheck(pass: { verifiedAt?: string } | null, now = new Date()): boolean {
  if (!pass) return false;
  if (!pass.verifiedAt) return true;
  const age = now.getTime() - Date.parse(pass.verifiedAt);
  return !Number.isFinite(age) || age < 0 || age > 7 * 86_400_000;
}

export type ConfirmOutcome = "paid" | "rejected" | "unavailable";

/**
 * Only a successful server response unlocks a new pass. Interrupted checks keep a pending
 * reference for retry; an already verified pass is preserved during temporary outages.
 */
export async function confirmPass(session: string, fetchImpl: typeof fetch = fetch): Promise<ConfirmOutcome> {
  if (!validSessionId(session)) return "rejected";
  try {
    const response = await fetchImpl("/api/move/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session }), credentials: "omit", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.status === "paid") return savePass(session, undefined, new Date(), true) ? "paid" : "unavailable";
    if (data?.status === "unavailable" || response.status === 429 || response.status >= 500) { savePass(session); return "unavailable"; }
    return "rejected";
  } catch { savePass(session); return "unavailable"; }
}
