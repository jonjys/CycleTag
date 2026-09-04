import type { Market, TagCategory, TagPayload } from "./tag";

type MarketConfig = { host: string; rotationId: string; label: string };

export const defaultCampaignId = "5339198614";

export const marketConfig: Record<Market, MarketConfig> = {
  US: { host: "www.ebay.com", rotationId: "711-53200-19255-0", label: "United States" },
  UK: { host: "www.ebay.co.uk", rotationId: "710-53481-19255-0", label: "United Kingdom" },
  DE: { host: "www.ebay.de", rotationId: "707-53477-19255-0", label: "Europe / Nordics" },
  FR: { host: "www.ebay.fr", rotationId: "709-53476-19255-0", label: "France" },
  IT: { host: "www.ebay.it", rotationId: "724-53478-19255-0", label: "Italy" },
  ES: { host: "www.ebay.es", rotationId: "1185-53479-19255-0", label: "Spain" },
  AU: { host: "www.ebay.com.au", rotationId: "705-53470-19255-0", label: "Australia" },
  CA: { host: "www.ebay.ca", rotationId: "706-53473-19255-0", label: "Canada" }
};

export function marketplaceName(market: Market): string {
  return marketConfig[market].host.replace(/^www\./, "").replace(/^ebay/i, "eBay");
}

export function marketChoiceLabel(market: Market): string {
  return `${marketConfig[market].label} · ${marketplaceName(market)}`;
}

export function marketDestinationNote(market: Market): string {
  return `Reorder links open ${marketplaceName(market)}. CycleTag currently routes ${marketConfig[market].label} to that one eBay marketplace.`;
}

export function validCampaignId(value: string | undefined): value is string {
  return typeof value === "string" && /^\d{6,20}$/.test(value);
}

export function buildEbayLink(tag: TagPayload, campaignId?: string): string {
  const market = marketConfig[tag.m];
  const url = new URL(`https://${market.host}/sch/i.html`);
  url.searchParams.set("_nkw", tag.q);
  if (validCampaignId(campaignId)) {
    url.searchParams.set("mkevt", "1");
    url.searchParams.set("mkcid", "1");
    url.searchParams.set("mkrid", market.rotationId);
    url.searchParams.set("campid", campaignId);
    url.searchParams.set("toolid", "10001");
    url.searchParams.set("customid", `cycletag-${safeCategory(tag.c)}`);
  }
  return url.toString();
}

function safeCategory(category: TagCategory): string {
  return category.replace(/[^a-z]/g, "").slice(0, 20) || "other";
}
