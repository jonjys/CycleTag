import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Generator } from "@/app/generator";
import { getReorderTool, reorderToolPath, reorderTools } from "@/lib/reorder-tools";
import { siteUrl } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return reorderTools.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getReorderTool(slug);
  if (!tool) return {};
  const canonical = reorderToolPath(tool);

  return {
    title: tool.title,
    description: tool.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${tool.title} · StayTag`,
      description: tool.description
    }
  };
}

export default async function ReorderToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getReorderTool(slug);
  if (!tool) notFound();

  const related = [
    ...reorderTools.filter((candidate) => candidate.slug !== tool.slug && candidate.group === tool.group),
    ...reorderTools.filter((candidate) => candidate.slug !== tool.slug && candidate.group !== tool.group)
  ].slice(0, 4);
  const canonical = `${siteUrl}${reorderToolPath(tool)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    description: tool.description,
    url: canonical,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }
  };

  return (
    <main className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <section className="tool-hero">
        <Link className="tool-back" href="/"><ArrowLeft aria-hidden="true" size={16} /> All StayTag tools</Link>
        <div className="section-kicker">FREE STATELESS QR TOOL</div>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <div className="tool-facts" aria-label="Tool facts">
          <span><CheckCircle2 aria-hidden="true" size={14} /> No account</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> No database</span>
          <span><CheckCircle2 aria-hidden="true" size={14} /> Free PNG + print</span>
        </div>
      </section>

      <Generator
        key={tool.slug}
        initialPreset={tool.preset}
        showPresets={false}
        title={`Create your ${tool.preset.name.toLowerCase()} label`}
        description="Replace the example search with your exact model or part number, then print the QR."
      />

      <section className="tool-guide no-print">
        <div>
          <div className="section-kicker">MAKE THE NEXT SCAN ACCURATE</div>
          <h2>Record the part, not just the product.</h2>
          <p>{tool.focus}</p>
        </div>
        <ol>
          {tool.checklist.map((item, index) => <li key={item}><b>0{index + 1}</b><span>{item}</span></li>)}
        </ol>
      </section>

      <section className="related-tools no-print" aria-labelledby="related-tools-title">
        <div className="section-kicker">MORE REORDER LABELS</div>
        <h2 id="related-tools-title">Label the next thing that runs out.</h2>
        <div className="related-grid">
          {related.map((candidate) => (
            <Link href={reorderToolPath(candidate)} key={candidate.slug}>
              <span>{candidate.preset.name}</span><ArrowRight aria-hidden="true" size={17} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

