import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { buildSpaceUrl, decodeSpace, encodeSpace, SPACE_MAX_ENCODED, validateSpace, type SpacePayload } from "../src/lib/space";
import { buildEbayLink, defaultCampaignId } from "../src/lib/affiliate";
import { decodeTag, encodeTag, type TagPayload } from "../src/lib/tag";

const item: TagPayload = { v: 1, n: "Coffee filter", q: "DeLonghi DLSC002", c: "coffee", i: 60, s: "2026-09-10", m: "DE" };
const space: SpacePayload = { v: 1, name: "Office coffee corner", items: [item] };
const raw = (data: unknown) => Buffer.from(JSON.stringify(data)).toString("base64url");

describe("CycleTag Spaces", () => {
  it("round-trips exact item details without a database", () => { expect(decodeSpace(encodeSpace(space))).toEqual(space); });
  it("round-trips international names", () => {
    const international = { ...space, name: "Kök / 台所 ☕", items: [{ ...item, n: "Vattenfilter 水" }] };
    expect(decodeSpace(encodeSpace(international))).toEqual(international);
  });
  it("normalizes names and strips unknown fields", () => {
    expect(validateSpace({ ...space, name: "  Office\n corner  ", admin: true })).toEqual({ ...space, name: "Office corner" });
  });
  it.each([null, {}, { ...space, v: 2 }, { ...space, name: " " }, { ...space, name: "x".repeat(61) }, { ...space, items: [] }, { ...space, items: Array(7).fill(item) }, { ...space, items: [null] }, { ...space, items: [{ ...item, s: "2026-02-30" }] }, { ...space, items: [{ ...item, m: "XX" }] }, { ...space, items: [{ ...item, i: 0 }] }])("rejects invalid payload %#", (bad) => { expect(validateSpace(bad)).toBeNull(); });
  it.each(["", "!bad", "a".repeat(SPACE_MAX_ENCODED + 1), raw([2, "Office", []]), raw([1, "Office", [["bad"]]]), raw({ name: "Office" }), "_w"]) ("rejects malformed link %#", (bad) => { expect(decodeSpace(bad)).toBeNull(); });
  it("puts data only in the fragment and removes query and credentials", () => {
    const url = new URL(buildSpaceUrl("https://user:pass@cycletag.eu/old?secret=1", space));
    expect(url.pathname).toBe("/space"); expect(url.search).toBe(""); expect(url.username).toBe("");
    expect(decodeSpace(new URLSearchParams(url.hash.slice(1)).get("d"))).toEqual(space);
  });
  it("rejects unsafe origins", () => { expect(() => buildSpaceUrl("javascript:alert(1)", space)).toThrow(); });
  it("six ordinary replacements fit into an actual QR", () => {
    const six = { ...space, items: Array.from({ length: 6 }, (_, i) => ({ ...item, n: `Replacement ${i + 1}` })) };
    const url = buildSpaceUrl("https://cycletag.eu", six);
    expect(decodeSpace(new URL(url).hash.slice(3))?.items).toHaveLength(6);
    expect(QRCode.create(url, { errorCorrectionLevel: "M" }).modules.size).toBeGreaterThan(0);
  });
  it("bounds dense Unicode payloads before generating a QR", () => {
    expect(() => encodeSpace({ ...space, items: Array(6).fill({ ...item, n: "水".repeat(80), q: "水".repeat(160) }) })).toThrow(/dense/);
  });
  it("decoded items retain the exact search, affiliate attribution and existing tag format", () => {
    const decoded = decodeSpace(encodeSpace(space))!;
    const tag = decoded.items[0];
    expect(decodeTag(encodeTag(tag))).toEqual(item);
    const url = new URL(buildEbayLink(tag, defaultCampaignId, "scan"));
    expect(url.host).toBe("www.ebay.de"); expect(url.searchParams.get("_nkw")).toBe(item.q);
    expect(url.searchParams.get("campid")).toBe(defaultCampaignId);
  });
});
