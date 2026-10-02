const siteUrl = "https://staytag.nyttolabs.com";
const host = "staytag.nyttolabs.com";
const key = "61d4a9fe5b3078c2e146f9a73bc580d1";
const keyLocation = `${siteUrl}/${key}.txt`;
const sitemapUrl = `${siteUrl}/sitemap.xml`;
const expectedRoutes = ["/reorder-label/printer-toner-qr-label", "/guides/qr-moving-box-labels", "/guides/qr-maintenance-labels"];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readLiveUrls() {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const [sitemapResponse, keyResponse] = await Promise.all([
        fetch(sitemapUrl, { signal: AbortSignal.timeout(10_000), headers: { "user-agent": "StayTag-IndexNow/1.1" } }),
        fetch(keyLocation, { signal: AbortSignal.timeout(10_000), headers: { "user-agent": "StayTag-IndexNow/1.1" } })
      ]);
      const [sitemap, publishedKey] = await Promise.all([sitemapResponse.text(), keyResponse.text()]);

      if (sitemapResponse.ok && keyResponse.ok && expectedRoutes.every(route => sitemap.includes(`${siteUrl}${route}</loc>`)) && publishedKey.trim() === key) {
        const urls = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
        if (urls.every(value => { const url = new URL(value); return url.origin === siteUrl && !url.search && !url.hash; })) return [...new Set(urls)];
      }
    } catch {
      // The deployment or DNS may still be propagating; retry below.
    }

    if (attempt < 12) await wait(10_000);
  }

  return [];
}

const urlList = await readLiveUrls();

if (urlList.length === 0) {
  console.warn("StayTag production is not ready for IndexNow yet; skipping this notification without failing the deployment.");
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  signal: AbortSignal.timeout(15_000),
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
}

console.log(`Submitted ${urlList.length} StayTag URLs to IndexNow (HTTP ${response.status}).`);
