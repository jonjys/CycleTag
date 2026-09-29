import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { decodePixels, textFromQr } from "@/lib/qr-decode";
import { buildTagUrl, decodeTag, type TagPayload } from "@/lib/tag";
import { replacedOn } from "@/lib/care";

/** Render a QR exactly like the app does (margin 4, dark on white), optionally degraded like a phone screenshot. */
function render(text: string, options: { scale?: number; margin?: number; invert?: boolean; noise?: number; pad?: number } = {}) {
  const { scale = 6, margin = 4, invert = false, noise = 0, pad = 0 } = options;
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const width = (size + margin * 2) * scale + pad * 2;
  const data = new Uint8ClampedArray(width * width * 4);
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const mx = Math.floor((x - pad) / scale) - margin, my = Math.floor((y - pad) / scale) - margin;
      let dark = mx >= 0 && my >= 0 && mx < size && my < size && qr.modules.get(my, mx) === 1;
      if (invert) dark = !dark;
      let value = dark ? 23 : 255;
      if (noise) value = Math.max(0, Math.min(255, value + (random() - 0.5) * noise));
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  return { data, width };
}

function decode(text: string, options?: Parameters<typeof render>[1]) {
  const { data, width } = render(text, options);
  return decodePixels(data, width, width);
}

const tag: TagPayload = { v: 1, n: "Kaffemaskinens vattenfilter åäö", q: "DeLonghi DLSC002", c: "coffee", i: 60, s: "2026-09-01", m: "DE", care: { part: "DLSC002", marketplace: true, history: [] } };

describe("QR generation and on-device decoding", () => {
  it("decodes a StayTag URL generated with the app's settings back to the same tag", () => {
    const url = buildTagUrl("https://cycletag.eu", tag);
    const decoded = decode(url);
    expect(decoded?.text).toBe(url);
    expect(decodeTag(new URLSearchParams(new URL(decoded!.text).hash.slice(1)).get("d"))).toEqual(tag);
  });

  it("decodes a fully-grown care chain near the payload limit", () => {
    let chain = tag;
    for (const day of ["2026-10-01", "2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01", "2027-03-01", "2027-04-01"]) chain = replacedOn(chain, day);
    const url = buildTagUrl("https://cycletag.eu", chain);
    expect(decode(url, { scale: 4 })?.text).toBe(url);
  });

  it("round-trips Swedish, Chinese, Japanese and emoji return codes", () => {
    for (const text of ["Retur: Åsa Öberg 12345", "退货编号 ZX-99887", "返品コード 5521", "🚚 RETURN-42"]) {
      expect(decode(text)?.text).toBe(text);
    }
  });

  it("reads inverted, noisy and padded screenshots", () => {
    const code = "https://returns.example.com/label/9F3K-22";
    expect(decode(code, { invert: true })?.text).toBe(code);
    expect(decode(code, { noise: 80 })?.text).toBe(code);
    expect(decode(code, { pad: 120, scale: 3 })?.text).toBe(code);
  });

  it("returns null for images without a QR", () => {
    const width = 200;
    const data = new Uint8ClampedArray(width * width * 4).fill(255);
    expect(decodePixels(data, width, width)).toBeNull();
  });

  it("falls back to UTF-8 bytes and rejects broken byte payloads", () => {
    expect(textFromQr("", Array.from(new TextEncoder().encode("åäö")))).toBe("åäö");
    expect(textFromQr("", [0xff, 0xfe])).toBeNull();
    expect(textFromQr("", [])).toBeNull();
  });
});
