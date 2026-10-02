import type { Metadata } from "next";
import { siteUrl } from "./site";

/** Keep search snippets and social previews specific to the page being shared. */
export function publicPageMetadata(path: string, title: string, description: string, image = "/opengraph-image"): Metadata {
  return {
    title, description,
    alternates: { canonical: path },
    openGraph: {
      type: "website", url: path, title: `${title} · StayTag`, description,
      siteName: "StayTag", locale: "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: title }]
    },
    twitter: { card: "summary_large_image", title: `${title} · StayTag`, description, images: [image] }
  };
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "StayTag", alternateName: "StayTag by Nytto Labs", url: siteUrl,
  inLanguage: "en", publisher: { "@type": "Organization", name: "Nytto Labs", url: "https://nyttolabs.com" }
};

export function applicationSchema(path: string, name: string, description: string, features: string[]) {
  return {
    "@context": "https://schema.org", "@type": "WebApplication",
    name, description, url: `${siteUrl}${path}`, applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any", browserRequirements: "Requires JavaScript and browser storage for saved lists.",
    featureList: features, publisher: websiteSchema.publisher
  };
}

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
