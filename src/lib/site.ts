export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://staytag.nyttolabs.com";
export const siteHost = new URL(siteUrl).host;
/** Former domain. Printed QR codes point here forever; it permanently redirects to siteUrl, keeping path, query and #fragment. */
export const legacyHosts = ["cycletag.eu", "www.cycletag.eu"] as const;
export const siteLaunchDate = new Date("2026-08-28T00:00:00.000Z");
