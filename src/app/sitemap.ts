import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://cycletag.vercel.app";
  return ["", "/privacy", "/terms", "/affiliate"].map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path ? "yearly" : "monthly", priority: path ? 0.3 : 1 }));
}
