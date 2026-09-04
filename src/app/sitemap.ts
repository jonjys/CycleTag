import type { MetadataRoute } from "next";
import { reorderToolPath, reorderTools } from "@/lib/reorder-tools";
import { siteLaunchDate, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: siteLaunchDate, changeFrequency: "weekly", priority: 1 },
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
