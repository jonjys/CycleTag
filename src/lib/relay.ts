import { markets, type Market, type TagPayload } from "./tag";

export const RELAY_KEY = "cycletag.relay.v1";
export const RELAY_LIMIT = 24;
export const RELAY_MAX_ENCODED = 8000;
export type RelayItem = { n: string; q: string; m: Market; quantity: number };
export type RelayList = { v: 1; items: RelayItem[] };
type Store = Pick<Storage, "getItem" | "setItem">;

function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 0 && text.length <= max ? text : null;
}
export function validateRelay(input: unknown): RelayList | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (value.v !== 1 || !Array.isArray(value.items) || value.items.length > RELAY_LIMIT) return null;
  const items: RelayItem[] = [];
  for (const raw of value.items) {
    if (!raw || typeof raw !== "object") return null;
    const n = clean(raw.n, 80), q = clean(raw.q, 160);
    if (!n || !q || !markets.includes(raw.m) || !Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 99) return null;
    const item: RelayItem = { n, q, m: raw.m, quantity: raw.quantity };
    if (items.some((existing) => relayItemKey(existing) === relayItemKey(item))) return null;
    items.push(item);
  }
  return { v: 1, items };
}
export function relayItemKey(item: Pick<RelayItem, "q" | "m">): string {
  return JSON.stringify([item.q.trim().replace(/\s+/g, " ").toLowerCase(), item.m]);
}
export function relayItemFromTag(tag: TagPayload): RelayItem {
  return { n: tag.n, q: tag.q, m: tag.m, quantity: 1 };
}
export function encodeRelay(list: RelayList): string {
  const valid = validateRelay(list);
  if (!valid || !valid.items.length) throw new Error("Add at least one item before sharing.");
  const bytes = new TextEncoder().encode(JSON.stringify([1, valid.items.map((i) => [i.n, i.q, i.m, i.quantity])]));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (encoded.length > RELAY_MAX_ENCODED) throw new Error("This list is too long to share as a link. Shorten names or share fewer items.");
  return encoded;
}
export function decodeRelay(encoded: string | null): RelayList | null {
  if (!encoded || encoded.length > RELAY_MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const data = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0))));
    if (!Array.isArray(data) || data.length !== 2 || data[0] !== 1 || !Array.isArray(data[1]) || !data[1].length) return null;
    return validateRelay({ v: 1, items: data[1].map((r: unknown) => Array.isArray(r) && r.length === 4 ? { n: r[0], q: r[1], m: r[2], quantity: r[3] } : null) });
  } catch { return null; }
}
export function buildRelayUrl(origin: string, list: RelayList): string {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("An HTTP origin is required.");
  url.username = ""; url.password = ""; url.pathname = "/relay"; url.search = "";
  url.hash = `list=${encodeRelay(list)}`;
  return url.toString();
}
export function parseRelay(raw: string | null): RelayList | null {
  if (raw === null) return { v: 1, items: [] };
  if (raw.length > 40000) return null;
  try { return validateRelay(JSON.parse(raw)); } catch { return null; }
}
export function getRelaySnapshot(): string | null {
  try { return window.localStorage.getItem(RELAY_KEY); } catch { return null; }
}
export const getRelayServerSnapshot = () => null;
export function subscribeRelay(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => { if (event.key === RELAY_KEY || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("cycletag:relay", callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("cycletag:relay", callback); };
}
export function writeRelay(list: RelayList, store?: Store): void {
  const valid = validateRelay(list);
  if (!valid) throw new Error("The list contains invalid items or quantities.");
  try { (store ?? window.localStorage).setItem(RELAY_KEY, JSON.stringify(valid)); }
  catch { throw new Error("Could not save. Browser storage is blocked or full. Keep a shared link as your backup."); }
  if (!store) window.dispatchEvent(new Event("cycletag:relay"));
}
export function addRelayItem(item: RelayItem, store?: Store): "added" | "exists" {
  const valid = validateRelay({ v: 1, items: [item] });
  if (!valid) throw new Error("Enter an item, exact search, marketplace and quantity from 1 to 99.");
  const normalized = valid.items[0];
  let current: RelayList | null;
  try { current = parseRelay((store ?? window.localStorage).getItem(RELAY_KEY)); }
  catch { throw new Error("Browser storage is blocked. Open Refill Relay to build and share a list instead."); }
  if (!current) throw new Error("Your saved list could not be read. Open Refill Relay to reset it.");
  if (current.items.some((i) => relayItemKey(i) === relayItemKey(normalized))) return "exists";
  if (current.items.length >= RELAY_LIMIT) throw new Error("Your list has 24 items. Finish or remove an item before adding another.");
  writeRelay({ v: 1, items: [...current.items, normalized] }, store);
  return "added";
}
