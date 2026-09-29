import { describe, expect, it } from "vitest";
import nextConfig, { legacyRedirects } from "../next.config";
import { legacyHosts, siteHost, siteUrl } from "@/lib/site";
import { buildTagUrl, decodeTag, type TagPayload } from "@/lib/tag";

const tag: TagPayload = { v: 1, n: "Filter", q: "Brita P1000", c: "water", i: 60, s: "2026-09-01", m: "DE" };

// Mirrors Next's path-to-regexp matching for the redirect source.
function redirectFor(host: string, path: string): string | null {
  const rule = legacyRedirects.find(r => r.has[0].value === host);
  if (!rule) return null;
  const match = /^\/((?!api\/).*)$/.exec(path);
  return match ? rule.destination.replace(":path", match[1]) : null;
}

describe("domain migration", () => {
  it("issues new QR links on staytag.nyttolabs.com", () => {
    expect(siteUrl).toBe("https://staytag.nyttolabs.com");
    const url = new URL(buildTagUrl(siteUrl, tag));
    expect(url.host).toBe(siteHost);
    expect(decodeTag(new URLSearchParams(url.hash.slice(1)).get("d"))).toEqual(tag);
  });

  it("permanently redirects every legacy host except /api", async () => {
    expect(legacyHosts).toEqual(["cycletag.eu", "www.cycletag.eu"]);
    expect(await nextConfig.redirects!()).toEqual(legacyRedirects);
    for (const rule of legacyRedirects) {
      expect(rule.permanent).toBe(true);
      expect(rule.destination).toBe("https://staytag.nyttolabs.com/:path");
    }
    expect(redirectFor("cycletag.eu", "/tag")).toBe("https://staytag.nyttolabs.com/tag");
    expect(redirectFor("cycletag.eu", "/")).toBe("https://staytag.nyttolabs.com/");
    expect(redirectFor("www.cycletag.eu", "/reorder-label/printer-toner-qr-label")).toBe("https://staytag.nyttolabs.com/reorder-label/printer-toner-qr-label");
    expect(redirectFor("cycletag.eu", "/api/health")).toBeNull();
    expect(redirectFor("staytag.nyttolabs.com", "/tag")).toBeNull();
  });
});
