import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (process.env.STAYTAG_SANDBOX === "1") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/tag", "/api/"] }], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl };
}
