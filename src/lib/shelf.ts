import { marketConfig } from "./affiliate";
import { builderPrintHash, decodeTag, type Market, type TagPayload } from "./tag";

export const SHELF_STORAGE_KEY = "cycletag.shelf.v1";
export const SHELF_LIMIT = 48;

export type ShelfStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type ShelfRecord = {
  encoded: string;
  name: string;
  query: string;
  market: Market;
  host: string;
  savedAt: string;
  lastReplaced: string;
};

export type ShelfWriteResult =
  | { ok: true; records: ShelfRecord[] }
  | { ok: false; reason: "unavailable" | "quota"; records: ShelfRecord[] };

export type ShelfStatus = "ready" | "unavailable";

type ShelfFile = { v: 1; items: unknown[] };

const emptyShelf: ShelfRecord[] = [];
const listeners = new Set<() => void>();

let snapshot: ShelfRecord[] = emptyShelf;
let snapshotRaw: string | null | undefined;
let cachedStatus: ShelfStatus = "ready";
let didProbeStatus = false;

export function memoryShelfStorage(options?: {
  initial?: Record<string, string>;
  quotaBytes?: number;
  throwOnAccess?: boolean;
}): ShelfStorage {
  const data = { ...(options?.initial ?? {}) };

  function guard(): void {
    if (options?.throwOnAccess) {
      const error = new Error("The operation is insecure.");
      error.name = "SecurityError";
      throw error;
    }
  }

  return {
    getItem(key) {
      guard();
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      guard();
      if (options?.quotaBytes !== undefined && value.length > options.quotaBytes) {
        const error = new Error("The quota has been exceeded.");
        error.name = "QuotaExceededError";
        throw error;
      }
      data[key] = value;
    },
    removeItem(key) {
      guard();
      delete data[key];
    }
  };
}

export function shelfRecordFromTag(tag: TagPayload, encoded: string, savedAt = new Date().toISOString()): ShelfRecord | null {
  if (!decodeTag(encoded) || !isIsoTimestamp(savedAt)) return null;
  return {
    encoded,
    name: tag.n,
    query: tag.q,
    market: tag.m,
    host: marketConfig[tag.m].host,
    savedAt,
    lastReplaced: tag.s
  };
}

export function shelfOpenHref(record: Pick<ShelfRecord, "encoded">): string {
  return `/tag#d=${record.encoded}`;
}

export function shelfPrintHref(record: Pick<ShelfRecord, "encoded">): string {
  return `/${builderPrintHash(record.encoded)}`;
}

export function listShelf(storage?: ShelfStorage): ShelfRecord[] {
  const store = storage ?? getBrowserStorage();
  if (!store) return [];
  try {
    return parseShelf(store.getItem(SHELF_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function probeShelfStorage(storage?: ShelfStorage): ShelfStatus {
  const store = storage ?? getBrowserStorage();
  if (!store) return "unavailable";
  const probeKey = `${SHELF_STORAGE_KEY}.probe`;
  try {
    store.setItem(probeKey, "1");
    store.removeItem(probeKey);
    return "ready";
  } catch {
    return "unavailable";
  }
}

export function saveShelfTag(
  tag: TagPayload,
  encoded: string,
  storage?: ShelfStorage,
  savedAt = new Date().toISOString()
): ShelfWriteResult {
  const record = shelfRecordFromTag(tag, encoded, savedAt);
  if (!record) return { ok: false, reason: "unavailable", records: listShelf(storage) };

  const store = storage ?? getBrowserStorage();
  if (!store) return browserUnavailable(storage === undefined);

  let records: ShelfRecord[];
  try {
    records = parseShelf(store.getItem(SHELF_STORAGE_KEY));
  } catch {
    return browserUnavailable(storage === undefined);
  }

  const existing = records.find((item) => item.encoded === encoded);
  const next: ShelfRecord[] = [
    { ...record, savedAt: existing?.savedAt ?? record.savedAt },
    ...records.filter((item) => item.encoded !== encoded)
  ].slice(0, SHELF_LIMIT);

  return commit(store, next, storage === undefined);
}

export function removeShelfTag(encoded: string, storage?: ShelfStorage): ShelfWriteResult {
  const store = storage ?? getBrowserStorage();
  if (!store) return browserUnavailable(storage === undefined);
  try {
    const records = parseShelf(store.getItem(SHELF_STORAGE_KEY)).filter((item) => item.encoded !== encoded);
    return commit(store, records, storage === undefined);
  } catch (error) {
    if (storage === undefined && !isQuotaError(error)) return browserUnavailable(true);
    return fail(isQuotaError(error) ? "quota" : "unavailable", []);
  }
}

export function clearShelf(storage?: ShelfStorage): ShelfWriteResult {
  const store = storage ?? getBrowserStorage();
  if (!store) return browserUnavailable(storage === undefined);
  try {
    store.removeItem(SHELF_STORAGE_KEY);
    if (storage === undefined) remember(emptyShelf, null);
    return { ok: true, records: emptyShelf };
  } catch (error) {
    if (storage === undefined && !isQuotaError(error)) return browserUnavailable(true);
    return fail(isQuotaError(error) ? "quota" : "unavailable", listShelf(store));
  }
}

export function subscribeShelf(onStoreChange: () => void): () => void {
  const first = listeners.size === 0;
  listeners.add(onStoreChange);
  if (first && typeof window !== "undefined") {
    window.addEventListener("storage", onBrowserStorage);
  }
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", onBrowserStorage);
    }
  };
}

export function getShelfSnapshot(): ShelfRecord[] {
  const store = getBrowserStorage();
  if (!store) {
    snapshot = emptyShelf;
    snapshotRaw = null;
    return snapshot;
  }

  let raw: string | null;
  try {
    raw = store.getItem(SHELF_STORAGE_KEY);
  } catch {
    snapshot = emptyShelf;
    snapshotRaw = null;
    return snapshot;
  }

  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  const records = parseShelf(raw);
  snapshot = records.length === 0 ? emptyShelf : records;
  return snapshot;
}

export function getServerShelfSnapshot(): ShelfRecord[] {
  return emptyShelf;
}

export function getShelfStatusSnapshot(): ShelfStatus {
  if (!didProbeStatus) {
    cachedStatus = probeShelfStorage();
    didProbeStatus = true;
  }
  return cachedStatus;
}

export function getServerShelfStatusSnapshot(): ShelfStatus {
  return "ready";
}

function commit(store: ShelfStorage, records: ShelfRecord[], notifyBrowser: boolean): ShelfWriteResult {
  let next = records;
  for (;;) {
    const raw = next.length === 0 ? null : serializeShelf(next);
    try {
      if (raw === null) store.removeItem(SHELF_STORAGE_KEY);
      else store.setItem(SHELF_STORAGE_KEY, raw);
      if (notifyBrowser) remember(next.length === 0 ? emptyShelf : next, raw);
      return { ok: true, records: next.length === 0 ? emptyShelf : next };
    } catch (error) {
      if (isQuotaError(error) && next.length > 1) {
        next = next.slice(0, -1);
        continue;
      }
      if (notifyBrowser && !isQuotaError(error)) {
        cachedStatus = "unavailable";
        didProbeStatus = true;
        for (const listener of listeners) listener();
      }
      return fail(isQuotaError(error) ? "quota" : "unavailable", listShelf(store));
    }
  }
}

function remember(records: ShelfRecord[], raw: string | null): void {
  snapshot = records.length === 0 ? emptyShelf : records;
  snapshotRaw = raw;
  cachedStatus = "ready";
  didProbeStatus = true;
  for (const listener of listeners) listener();
}

function onBrowserStorage(event: StorageEvent): void {
  if (event.key !== SHELF_STORAGE_KEY && event.key !== null) return;
  snapshotRaw = undefined;
  getShelfSnapshot();
  for (const listener of listeners) listener();
}

function getBrowserStorage(): ShelfStorage | null {
  try {
    const storage = globalThis.localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

function parseShelf(raw: string | null): ShelfRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<ShelfFile>;
    if (parsed?.v !== 1 || !Array.isArray(parsed.items)) return [];
    const records: ShelfRecord[] = [];
    for (const item of parsed.items) {
      const record = asShelfRecord(item);
      if (record) records.push(record);
    }
    return records.slice(0, SHELF_LIMIT);
  } catch {
    return [];
  }
}

function serializeShelf(records: ShelfRecord[]): string {
  const file: ShelfFile = { v: 1, items: records };
  return JSON.stringify(file);
}

function asShelfRecord(value: unknown): ShelfRecord | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<ShelfRecord>;
  if (typeof item.encoded !== "string" || typeof item.savedAt !== "string") return null;
  const tag = decodeTag(item.encoded);
  if (!tag || !isIsoTimestamp(item.savedAt)) return null;
  return {
    encoded: item.encoded,
    name: typeof item.name === "string" && item.name.trim() ? item.name : tag.n,
    query: typeof item.query === "string" && item.query.trim() ? item.query : tag.q,
    market: tag.m,
    host: marketConfig[tag.m].host,
    savedAt: item.savedAt,
    lastReplaced: tag.s
  };
}

function isIsoTimestamp(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { name?: string; code?: number };
  return value.name === "QuotaExceededError" || value.name === "NS_ERROR_DOM_QUOTA_REACHED" || value.code === 22 || value.code === 1014;
}

function fail(reason: "unavailable" | "quota", records: ShelfRecord[]): ShelfWriteResult {
  return { ok: false, reason, records };
}

function browserUnavailable(notify: boolean): ShelfWriteResult {
  if (notify) {
    cachedStatus = "unavailable";
    didProbeStatus = true;
    for (const listener of listeners) listener();
  }
  return fail("unavailable", []);
}
