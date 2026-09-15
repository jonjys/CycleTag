import type { MetadataRoute } from "next";
import { reorderToolPath, reorderTools } from "@/lib/reorder-tools";
import { siteLaunchDate, siteUrl } from "@/lib/site";

const latestProductUpdate = "2026-09-15";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/sellers`, lastModified: latestProductUpdate, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/relay`, lastModified: latestProductUpdate, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/spaces`, lastModified: siteLaunchDate, changeFrequency: "monthly", priority: 0.9 },
    { url: siteUrl, lastModified: latestProductUpdate, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/bulk`, lastModified: siteLaunchDate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/privacy`, lastModified: siteLaunchDate, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/terms`, lastModified: siteLaunchDate, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/affiliate`, lastModified: siteLaunchDate, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/support`, lastModified: siteLaunchDate, changeFrequency: "yearly", priority: 0.3 }
  ];
  const toolPages: MetadataRoute.Sitemap = reorderTools.map((tool) => ({
    url: `${siteUrl}${reorderToolPath(tool)}`,
    lastModified: siteLaunchDate,
    changeFrequency: "monthly",
    priority: 0.8
  }));

  return [...staticPages, ...toolPages];
}
