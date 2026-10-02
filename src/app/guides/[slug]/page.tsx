import { notFound } from "next/navigation";
import { getGuide, guidePath, guides, guideUpdated } from "@/lib/guides";
import { jsonLd, publicPageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { GuideArticle } from "../guide-article";
import "../guides.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return guides.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return publicPageMetadata(guidePath(guide), guide.title[0], guide.description[0], guide.destination === "/move" ? "/move/opengraph-image" : undefined);
}
export default async function GuidePage({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const url = `${siteUrl}${guidePath(guide)}`;
  const schema = {
    "@context": "https://schema.org", "@graph": [
      { "@type": "Article", headline: guide.title[0], description: guide.description[0], mainEntityOfPage: url, inLanguage: "en", datePublished: guideUpdated, dateModified: guideUpdated, author: { "@type": "Organization", name: "Nytto Labs", url: "https://nyttolabs.com" }, publisher: { "@type": "Organization", name: "Nytto Labs", url: "https://nyttolabs.com" } },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "StayTag", item: siteUrl },
        { "@type": "ListItem", position: 2, name: guide.title[0], item: url }
      ] }
    ]
  };
  const related = guides.find(candidate => candidate.slug !== guide.slug)!;
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} /><GuideArticle guide={guide} related={related} /></>;
}
