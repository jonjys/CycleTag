import { describe, expect, it } from "vitest";
import {
  affiliateCustomId,
  buildEbayLink,
  defaultCampaignId,
  marketChoiceLabel,
  marketConfig,
  marketDestinationNote,
  marketplaceName,
  validCampaignId
} from "@/lib/affiliate";
import { markets, type TagPayload } from "@/lib/tag";

const tag: TagPayload = { v: 1, n: "Filter", q: "Bosch filter 123 & XL", c: "water", i: 180, s: "2026-08-27", m: "DE" };

describe("eBay affiliate links", () => {
  it("creates an official parameterized tracking link", () => {
    const url = new URL(buildEbayLink(tag, defaultCampaignId));
    expect(url.hostname).toBe("www.ebay.de");
    expect(url.searchParams.get("_nkw")).toBe(tag.q);
    expect(url.searchParams.get("campid")).toBe("5339198614");
    expect(url.searchParams.get("mkrid")).toBe("707-53477-19255-0");
    expect(url.searchParams.get("customid")).toBe("cycletag-scan-water");
  });

  it("separates instant, scan and printer affiliate sources", () => {
    expect(new URL(buildEbayLink(tag, defaultCampaignId, "instant")).searchParams.get("customid")).toBe("cycletag-instant-water");
    expect(new URL(buildEbayLink(tag, defaultCampaignId, "scan")).searchParams.get("customid")).toBe("cycletag-scan-water");
    expect(new URL(buildEbayLink(tag, defaultCampaignId, "printer")).searchParams.get("customid")).toBe("cycletag-printer-office");
    expect(affiliateCustomId("coffee", "instant")).toBe("cycletag-instant-coffee");
  });

  it("falls back to a clean marketplace search without a valid campaign", () => {
    const url = new URL(buildEbayLink(tag, "bad<script>", "instant"));
    expect(url.searchParams.get("_nkw")).toBe(tag.q);
    expect(url.searchParams.has("campid")).toBe(false);
    expect(url.searchParams.has("customid")).toBe(false);
    expect(validCampaignId("123456")).toBe(true);
    expect(validCampaignId("123")).toBe(false);
  });

  it("makes the eBay destination explicit for each shopping region", () => {
    expect(marketplaceName("DE")).toBe("eBay.de");
    expect(marketChoiceLabel("DE")).toBe("Europe / Nordics · eBay.de");
    expect(marketDestinationNote("DE")).toContain("eBay.de");
    expect(marketplaceName("UK")).toBe("eBay.co.uk");
    expect(marketplaceName("US")).toBe("eBay.com");
    expect(marketplaceName("AU")).toBe("eBay.com.au");

    for (const market of markets) {
      const host = marketConfig[market].host.replace(/^www\./, "");
      expect(marketplaceName(market).toLowerCase()).toBe(host);
      expect(marketChoiceLabel(market)).toContain(marketplaceName(market));
    }
  });
});
