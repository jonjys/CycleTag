import { validateTag, type TagPayload } from "./tag";

export const SPACE_LIMIT = 6;
export const SPACE_MAX_ENCODED = 1800;
export type SpacePayload = { v: 1; name: string; items: TagPayload[] };

export function validateSpace(input: unknown): SpacePayload | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  if (value.v !== 1 || typeof value.name !== "string" || !Array.isArray(value.items)) return null;
  const name = value.name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!name || name.length > 60 || value.items.length < 1 || value.items.length > SPACE_LIMIT) return null;
  const items = value.items.map(validateTag);
  if (items.some((item) => !item)) return null;
  return { v: 1, name, items: items as TagPayload[] };
}

// Compact tuples leave room for several real model numbers in one printable QR.
// No URL, HTML or executable content is accepted as a destination.
export function encodeSpace(input: SpacePayload): string {
  const space = validateSpace(input);
  if (!space) throw new Error("Add a space name and 1–6 valid items with model numbers and dates.");
  const compact = [1, space.name, space.items.map((t) => [t.n, t.q, t.c, t.i, t.s, t.m])];
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (encoded.length > SPACE_MAX_ENCODED) throw new Error("This QR is too dense. Shorten item names/searches or split the space into two labels.");
  return encoded;
}

export function decodeSpace(encoded: string | null): SpacePayload | null {
  if (!encoded || encoded.length > SPACE_MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const data: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!Array.isArray(data) || data.length !== 3 || data[0] !== 1 || !Array.isArray(data[2])) return null;
    const items = data[2].map((row: unknown) => {
      if (!Array.isArray(row) || row.length !== 6) return null;
      return { v: 1, n: row[0], q: row[1], c: row[2], i: row[3], s: row[4], m: row[5] };
    });
    return validateSpace({ v: data[0], name: data[1], items });
  } catch { return null; }
}

export function buildSpaceUrl(origin: string, space: SpacePayload): string {
  const url = new URL(origin);
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("An HTTP origin is required.");
  url.username = "";
  url.password = "";
  url.pathname = "/space";
  url.search = "";
  url.hash = `d=${encodeSpace(space)}`;
  return url.toString();
}
