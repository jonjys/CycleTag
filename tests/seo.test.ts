import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { generateStaticParams, generateMetadata } from "@/app/guides/[slug]/page";
import { guides, guidePath } from "@/lib/guides";
import { jsonLd, publicPageMetadata, websiteSchema } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

describe("public search discovery", () => {
  it("publishes canonical public URLs without QR content or private reader pages", () => {
    const entries = sitemap();
    expect(new Set(entries.map(entry => entry.url)).size).toBe(entries.length);
    for (const entry of entries) {
      const url = new URL(entry.url);
      expect(url.origin).toBe(siteUrl);
      expect(url.hash).toBe("");
      expect(url.search).toBe("");
      expect(["/tag", "/box", "/space", "/reorder", "/care-sheet", "/insights"]).not.toContain(url.pathname);
    }
    for (const guide of guides) expect(entries.map(entry => entry.url)).toContain(`${siteUrl}${guidePath(guide)}`);
  });

  it("prerenders guides with matching canonical and share metadata", async () => {
    expect(generateStaticParams()).toEqual(guides.map(({ slug }) => ({ slug })));
    for (const guide of guides) {
      const metadata = await generateMetadata({ params: Promise.resolve({ slug: guide.slug }) });
      expect(metadata.alternates?.canonical).toBe(guidePath(guide));
      expect(metadata.openGraph?.url).toBe(guidePath(guide));
      expect(metadata.description).toBe(guide.description[0]);
      expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: `${guide.title[0]} · StayTag` });
    }
    expect(publicPageMetadata("/move", "Move", "Boxes", "/move/opengraph-image").twitter).toMatchObject({ images: ["/move/opengraph-image"] });
  });

  it("safely embeds structured data and names the current website", () => {
    const encoded = jsonLd({ text: "</script><script>alert(1)</script>" });
    expect(encoded).not.toContain("<");
    expect(JSON.parse(encoded)).toEqual({ text: "</script><script>alert(1)</script>" });
    expect(websiteSchema).toMatchObject({ name: "StayTag", url: siteUrl, publisher: { name: "Nytto Labs" } });
  });
});
