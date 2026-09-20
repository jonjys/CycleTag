import { describe, expect, it } from "vitest";
import { careDue, careEvents, hashPhoto, logReplacement } from "@/lib/care";
import { buildTagUrl, decodeTag, encodeTag, validateTag, type TagPayload } from "@/lib/tag";
import { memoryShelfStorage, saveShelfTag } from "@/lib/shelf";

const legacy: TagPayload = { v: 1, n: "Filter", q: "Filter 123", i: 60, s: "2024-01-01", c: "water", m: "DE" };
const care: TagPayload = { ...legacy, care: { part: "123", photo: "a".repeat(64), history: [], marketplace: false } };
describe("care snapshots", () => {
  it("roundtrips legacy and care tags without a server query", () => {
    for (const tag of [legacy, care]) {
      expect(decodeTag(encodeTag(tag))).toEqual(tag);
      const url = new URL(buildTagUrl("https://cycletag.eu", tag));
      expect(url.search).toBe(""); expect(url.hash).toContain("d=");
    }
  });
  it("keeps a due date anchored to the actual last replacement across leap years", () => {
    expect(careDue(care)).toBe("2024-03-01");
    expect(careDue({ s: "2024-02-28", i: 1 })).toBe("2024-02-29");
    expect(careDue({ s: "2025-12-31", i: 1 })).toBe("2026-01-01");
  });
  it("logs into a new QR, retains previous evidence and leaves the old snapshot unchanged", () => {
    const before = encodeTag(care);
    const next = logReplacement(care, { ...care, s: "2024-03-02", care: { part: "456", marketplace: false, history: [] } });
    expect(next.care?.history[0].photo).toBe("a".repeat(64));
    expect(next.care?.photo).toBeUndefined();
    expect(careEvents(next)).toHaveLength(2);
    expect(careDue(next)).toBe("2024-05-01");
    expect(encodeTag(care)).toBe(before);
    expect(encodeTag(next)).not.toBe(before);
    expect(decodeTag(encodeTag(next))).toEqual(next);
  });
  it("rejects invalid evidence, unordered history and earlier replacement dates", () => {
    expect(validateTag({ ...care, care: { ...care.care, photo: "https://example.com/photo.jpg" } })).toBeNull();
    expect(validateTag({ ...care, s: "2024-02-30" })).toBeNull();
    expect(validateTag({ ...care, care: { ...care.care, history: [{ n: "x", s: "2025-01-01", i: 20 }] } })).toBeNull();
    expect(() => logReplacement(care, { ...care, s: "2023-01-01" })).toThrow("before");
  });
  it("never silently drops history at the chain or QR size limit", () => {
    const full = { ...care, care: { ...care.care!, history: Array.from({ length: 5 }, () => ({ n: "Filter", s: care.s, i: 60 })) } };
    expect(() => logReplacement(full, care)).toThrow("six care entries");
    const huge = { ...full, n: "水".repeat(80), care: { ...full.care, history: full.care.history.map(e => ({ ...e, n: "水".repeat(80), part: "水".repeat(60), photo: "a".repeat(64) })) } };
    expect(() => encodeTag(huge)).toThrow("too large");
  });
  it("hashes exact local bytes and rejects non-images or oversized photos", async () => {
    expect(await hashPhoto(new File(["abc"], "test.png", { type: "image/png" }))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    await expect(hashPhoto(new File(["abc"], "test.txt", { type: "text/plain" }))).rejects.toThrow("image");
    await expect(hashPhoto({ type: "image/png", size: 21 * 1024 * 1024 } as File)).rejects.toThrow("20 MB");
  });
  it("preserves full care payloads in the existing local shelf", () => {
    const result = saveShelfTag(care, encodeTag(care), memoryShelfStorage());
    expect(result.ok).toBe(true);
    expect(decodeTag(result.records[0].encoded)).toEqual(care);
  });
});
