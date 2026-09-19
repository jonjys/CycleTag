export const categories = [
  "office",
  "water",
  "coffee",
  "cleaning",
  "pet",
  "workshop",
  "home",
  "other"
] as const;

export const markets = ["US", "UK", "DE", "FR", "IT", "ES", "AU", "CA"] as const;

export type TagCategory = (typeof categories)[number];
export type Market = (typeof markets)[number];

export type CareEvent = { n: string; s: string; i: number; part?: string; photo?: string };
export type CareData = { part?: string; photo?: string; history: CareEvent[]; marketplace: boolean };

export type TagPayload = {
  v: 1;
  n: string;
  q: string;
  c: TagCategory;
  i: number;
  s: string;
  m: Market;
  care?: CareData;
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const maxEncodedLength = 2200;

export function validIsoDay(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 0 && cleaned.length <= max ? cleaned : null;
}

export function validateTag(input: unknown): TagPayload | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const name = cleanText(value.n, 80);
  const query = cleanText(value.q, 160);
  const interval = Number(value.i);
  const start = typeof value.s === "string" ? value.s : "";

  if (
    value.v !== 1 ||
    !name ||
    !query ||
    !categories.includes(value.c as TagCategory) ||
    !markets.includes(value.m as Market) ||
    !Number.isInteger(interval) ||
    interval < 1 ||
    interval > 730 ||
    !validIsoDay(start)
  ) {
    return null;
  }

  let care: CareData | undefined;
  if (value.care !== undefined) {
    if (!value.care || typeof value.care !== "object") return null;
    const raw = value.care as Record<string, unknown>;
    if (typeof raw.marketplace !== "boolean" || !Array.isArray(raw.history) || raw.history.length > 5) return null;
    const current = validateCareEvent({ ...raw, n: name, s: start, i: interval });
    const history = raw.history.map(validateCareEvent);
    if (!current || history.some((event) => !event)) return null;
    const events = history as CareEvent[];
    if (events.some((event, index) => event.s > start || (index > 0 && event.s < events[index - 1].s))) return null;
    care = { ...(current.part ? { part: current.part } : {}), ...(current.photo ? { photo: current.photo } : {}), history: events, marketplace: raw.marketplace };
  }
  return {
    v: 1,
    n: name,
    q: query,
    c: value.c as TagCategory,
    i: interval,
    s: start,
    m: value.m as Market,
    ...(care ? { care } : {})
  };
}

function validateCareEvent(input: unknown): CareEvent | null {
  if (!input || typeof input !== "object") return null;
  const event = input as Record<string, unknown>;
  const n = cleanText(event.n, 80);
  const part = event.part === undefined ? undefined : cleanText(event.part, 60);
  if (!n || part === null || typeof event.s !== "string" || !validIsoDay(event.s) || !Number.isInteger(event.i) || Number(event.i) < 1 || Number(event.i) > 730) return null;
  if (event.photo !== undefined && (typeof event.photo !== "string" || !/^[a-f0-9]{64}$/.test(event.photo))) return null;
  return { n, s: event.s, i: Number(event.i), ...(part ? { part } : {}), ...(event.photo ? { photo: event.photo as string } : {}) };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function encodeTag(input: TagPayload): string {
  const tag = validateTag(input);
  if (!tag) throw new Error("Invalid CycleTag payload");
  const encoded = bytesToBase64(new TextEncoder().encode(JSON.stringify(tag)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  if (encoded.length > maxEncodedLength) throw new Error("This care chain is too large for a reliable QR. Shorten the item name or start a new chain, keeping this snapshot.");
  return encoded;
}

export function decodeTag(encoded: string | null): TagPayload | null {
  if (!encoded || encoded.length > maxEncodedLength || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const json = new TextDecoder().decode(base64ToBytes(padded));
    return validateTag(JSON.parse(json));
  } catch {
    return null;
  }
}

export function buildTagUrl(origin: string, tag: TagPayload): string {
  const safeOrigin = new URL(origin);
  if (safeOrigin.protocol !== "https:" && safeOrigin.protocol !== "http:") {
    throw new Error("CycleTag requires an HTTP origin");
  }
  safeOrigin.pathname = "/tag";
  safeOrigin.search = "";
  safeOrigin.hash = new URLSearchParams({ d: encodeTag(tag) }).toString();
  return safeOrigin.toString();
}

export function builderEditHash(encoded: string): string {
  return `#edit=${encoded}`;
}

export function builderPrintHash(encoded: string): string {
  return `#print=${encoded}`;
}

export function payloadFromBuilderHash(hash: string): { encoded: string; tag: TagPayload; reprint: boolean; logging?: boolean } | null {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const printEncoded = params.get("print");
  const logEncoded = params.get("log");
  const encoded = printEncoded ?? logEncoded ?? params.get("edit") ?? params.get("clone");
  const tag = decodeTag(encoded);
  if (!encoded || !tag) return null;
  return { encoded, tag, reprint: Boolean(printEncoded), ...(!printEncoded && logEncoded ? { logging: true } : {}) };
}
