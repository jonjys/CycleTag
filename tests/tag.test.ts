import { describe, expect, it } from "vitest";
import {
  builderEditHash,
  buildTagUrl,
  decodeTag,
  encodeTag,
  payloadFromBuilderHash,
  validateTag,
  type TagPayload
} from "@/lib/tag";

const tag: TagPayload = { v: 1, n: "Brother toner åäö", q: "Brother TN-3480 black", c: "office", i: 90, s: "2026-08-27", m: "DE" };

describe("CycleTag codec", () => {
  it("round-trips unicode data", () => {
    expect(decodeTag(encodeTag(tag))).toEqual(tag);
  });

  it("rejects malformed and oversized data", () => {
    expect(decodeTag("%%%" )).toBeNull();
    expect(decodeTag("a".repeat(2201))).toBeNull();
    expect(validateTag({ ...tag, i: 0 })).toBeNull();
    expect(validateTag({ ...tag, q: "" })).toBeNull();
    expect(validateTag({ ...tag, s: "2026-02-31" })).toBeNull();
  });

  it("round-trips maximum-length multibyte fields", () => {
    const maximum: TagPayload = { ...tag, n: "Å".repeat(80), q: "☕".repeat(160) };
    expect(decodeTag(encodeTag(maximum))).toEqual(maximum);
  });

  it("builds a tag URL without carrying unrelated parameters", () => {
    const url = new URL(buildTagUrl("https://example.com/old?secret=yes", tag));
    expect(url.origin + url.pathname).toBe("https://example.com/tag");
    expect(url.searchParams.has("secret")).toBe(false);
    expect(url.search).toBe("");
    expect(decodeTag(new URLSearchParams(url.hash.slice(1)).get("d"))).toEqual(tag);
  });

  it("rejects non-web origins", () => {
    expect(() => buildTagUrl("javascript:alert(1)", tag)).toThrow();
  });

  it("reads an edit payload from the builder hash without sending it as a query", () => {
    const encoded = encodeTag(tag);
    expect(builderEditHash(encoded)).toBe(`#edit=${encoded}`);
    expect(payloadFromBuilderHash(builderEditHash(encoded))).toEqual({ encoded, tag });
    expect(payloadFromBuilderHash(`#clone=${encoded}`)).toEqual({ encoded, tag });
    expect(payloadFromBuilderHash("#edit=%%%")).toBeNull();
  });
});
