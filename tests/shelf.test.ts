import { afterEach, describe, expect, it } from "vitest";
import {
  SHELF_LIMIT,
  SHELF_STORAGE_KEY,
  clearShelf,
  listShelf,
  memoryShelfStorage,
  probeShelfStorage,
  removeShelfTag,
  saveShelfTag,
  shelfOpenHref,
  shelfPrintHref,
  shelfRecordFromTag
} from "@/lib/shelf";
import { builderPrintHash, encodeTag, type TagPayload } from "@/lib/tag";

const toner: TagPayload = { v: 1, n: "Office toner", q: "Brother TN-3480 black", c: "office", i: 90, s: "2026-08-27", m: "DE" };
const filter: TagPayload = { v: 1, n: "Water filter", q: "BRITA Maxtra Pro", c: "water", i: 30, s: "2026-09-01", m: "UK" };

afterEach(() => {
  try {
    globalThis.localStorage?.removeItem(SHELF_STORAGE_KEY);
  } catch {
    // Node has no localStorage.
  }
});

describe("CycleTag local shelf", () => {
  it("saves a lightweight record and lists it newest first", () => {
    const storage = memoryShelfStorage();
    const tonerEncoded = encodeTag(toner);
    const filterEncoded = encodeTag(filter);

    expect(saveShelfTag(toner, tonerEncoded, storage, "2026-09-04T08:00:00.000Z")).toMatchObject({ ok: true });
    expect(saveShelfTag(filter, filterEncoded, storage, "2026-09-04T09:00:00.000Z")).toMatchObject({ ok: true });

    const records = listShelf(storage);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      encoded: filterEncoded,
      name: "Water filter",
      query: "BRITA Maxtra Pro",
      market: "UK",
      host: "www.ebay.co.uk",
      savedAt: "2026-09-04T09:00:00.000Z",
      lastReplaced: "2026-09-01"
    });
    expect(records[1]?.name).toBe("Office toner");
    expect(shelfOpenHref(records[0])).toBe(`/tag#d=${filterEncoded}`);
    expect(shelfPrintHref(records[0])).toBe(`/${builderPrintHash(filterEncoded)}`);
  });

  it("upserts the same payload without duplicating it and keeps the original saved time", () => {
    const storage = memoryShelfStorage();
    const encoded = encodeTag(toner);
    saveShelfTag(toner, encoded, storage, "2026-09-04T08:00:00.000Z");
    saveShelfTag(filter, encodeTag(filter), storage, "2026-09-04T09:00:00.000Z");
    saveShelfTag(toner, encoded, storage, "2026-09-04T10:00:00.000Z");

    const records = listShelf(storage);
    expect(records).toHaveLength(2);
    expect(records[0]?.encoded).toBe(encoded);
    expect(records[0]?.savedAt).toBe("2026-09-04T08:00:00.000Z");
  });

  it("removes one tag and can clear the whole local list", () => {
    const storage = memoryShelfStorage();
    const tonerEncoded = encodeTag(toner);
    saveShelfTag(toner, tonerEncoded, storage);
    saveShelfTag(filter, encodeTag(filter), storage);

    expect(removeShelfTag(tonerEncoded, storage).ok).toBe(true);
    expect(listShelf(storage).map((item) => item.name)).toEqual(["Water filter"]);

    expect(clearShelf(storage).ok).toBe(true);
    expect(listShelf(storage)).toEqual([]);
  });

  it("ignores corrupt JSON and records that no longer decode", () => {
    const storage = memoryShelfStorage({
      initial: { [SHELF_STORAGE_KEY]: "{not-json" }
    });
    expect(listShelf(storage)).toEqual([]);

    storage.setItem(SHELF_STORAGE_KEY, JSON.stringify({
      v: 1,
      items: [
        { encoded: "%%%", name: "Broken", savedAt: "2026-09-04T08:00:00.000Z" },
        shelfRecordFromTag(toner, encodeTag(toner), "2026-09-04T08:00:00.000Z")
      ]
    }));
    expect(listShelf(storage).map((item) => item.name)).toEqual(["Office toner"]);
  });

  it("caps the list and reports private-mode or quota failures without throwing", () => {
    const capped = memoryShelfStorage();
    for (let index = 0; index < SHELF_LIMIT + 5; index += 1) {
      const tag: TagPayload = { ...toner, n: `Item ${index}`, q: `Search ${index}` };
      const result = saveShelfTag(tag, encodeTag(tag), capped, `2026-09-04T08:${String(index).padStart(2, "0")}:00.000Z`);
      expect(result.ok).toBe(true);
    }
    expect(listShelf(capped)).toHaveLength(SHELF_LIMIT);
    expect(listShelf(capped)[0]?.name).toBe(`Item ${SHELF_LIMIT + 4}`);

    const blocked = memoryShelfStorage({ throwOnAccess: true });
    expect(probeShelfStorage(blocked)).toBe("unavailable");
    expect(saveShelfTag(toner, encodeTag(toner), blocked)).toEqual({ ok: false, reason: "unavailable", records: [] });
    expect(listShelf(blocked)).toEqual([]);

    const tiny = memoryShelfStorage({ quotaBytes: 8 });
    const quota = saveShelfTag(toner, encodeTag(toner), tiny);
    expect(quota.ok).toBe(false);
    if (quota.ok) throw new Error("expected quota failure");
    expect(quota.reason).toBe("quota");
    expect(listShelf(tiny)).toEqual([]);
  });

  it("builds a display record from a tag payload", () => {
    const encoded = encodeTag(toner);
    expect(shelfRecordFromTag(toner, encoded, "2026-09-04T08:00:00.000Z")).toEqual({
      encoded,
      name: toner.n,
      query: toner.q,
      market: "DE",
      host: "www.ebay.de",
      savedAt: "2026-09-04T08:00:00.000Z",
      lastReplaced: "2026-08-27"
    });
    expect(shelfRecordFromTag(toner, "%%%")).toBeNull();
  });
});
