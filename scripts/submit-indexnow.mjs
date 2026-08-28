const siteUrl = "https://cycletag.eu";
const host = "cycletag.eu";
const key = "61d4a9fe5b3078c2e146f9a73bc580d1";
const keyLocation = `${siteUrl}/${key}.txt`;
const sitemapUrl = `${siteUrl}/sitemap.xml`;
const expectedRoute = "/reorder-label/printer-toner-qr-label";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readLiveUrls() {
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const [sitemapResponse, keyResponse] = await Promise.all([
        fetch(sitemapUrl, { headers: { "user-agent": "CycleTag-IndexNow/1.0" } }),
        fetch(keyLocation, { headers: { "user-agent": "CycleTag-IndexNow/1.0" } })
      ]);
      const [sitemap, publishedKey] = await Promise.all([sitemapResponse.text(), keyResponse.text()]);

      if (sitemapResponse.ok && keyResponse.ok && sitemap.includes(expectedRoute) && publishedKey.trim() === key) {
        return [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
      }
    } catch {
      // The deployment or DNS may still be propagating; retry below.
    }

    if (attempt < 24) await wait(10_000);
  }

  return [];
}

const urlList = await readLiveUrls();

if (urlList.length === 0) {
  console.warn("CycleTag production is not ready for IndexNow yet; skipping this notification without failing the deployment.");
  process.exit(0);
}

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host, key, keyLocation, urlList })
});

if (![200, 202].includes(response.status)) {
  throw new Error(`IndexNow returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
}

console.log(`Submitted ${urlList.length} CycleTag URLs to IndexNow (HTTP ${response.status}).`);
