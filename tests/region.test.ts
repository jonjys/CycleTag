import { describe, expect, it } from "vitest";
import { marketForCountry, marketForLanguage } from "@/lib/region";
import { GET } from "@/app/api/region/route";
import { buildEbayLink, defaultCampaignId } from "@/lib/affiliate";
describe("new-tag market selection", () => {
  it.each(["SE", "NO", "DK", "FI", "", "unknown"])("routes %s to Europe, not the US", country => expect(marketForCountry(country)).toBe("DE"));
  it.each([["sv-SE", "DE"], ["en", "DE"], ["en-US", "US"], ["en-GB", "UK"], ["en-AU", "AU"], ["fr-CA", "CA"]])("maps %s to %s", (language, market) => expect(marketForLanguage(language)).toBe(market));
  it("uses the country header without returning country information", async () => {
    const response = await GET(new Request("https://cycletag.eu/api/region", { headers: { "x-vercel-ip-country": "SE", "accept-language": "en-US" } }));
    expect(await response.json()).toEqual({ market: "DE" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
  it("keeps the campaign and Nordic routing in the real URL", () => {
    const url = new URL(buildEbayLink({ v: 1, n: "Coffee filter", q: "DeLonghi DLSC002", c: "coffee", s: "2026-09-01", i: 60, m: marketForCountry("SE") }, defaultCampaignId, "scan"));
    expect(url.hostname).toBe("www.ebay.de"); expect(url.searchParams.get("campid")).toBe("5339198614");
    expect(url.searchParams.get("mkevt")).toBe("1"); expect(url.searchParams.get("mkcid")).toBe("1");
    expect(url.searchParams.get("mkrid")).toBe("707-53477-19255-0"); expect(url.searchParams.get("toolid")).toBe("10001");
    expect(url.searchParams.get("customid")).toBe("cycletag-scan-coffee");
  });
});
