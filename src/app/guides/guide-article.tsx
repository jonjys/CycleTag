"use client";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { guidePath, type Guide } from "@/lib/guides";

export function GuideArticle({ guide, related }: { guide: Guide; related: Guide }) {
  const { t, locale } = useLocale();
  return <main className="staytag-guide no-print" lang={locale}>
    <nav aria-label={t("Breadcrumb", "Brödsmulor")}><Link href="/">StayTag</Link><span aria-hidden="true"> / </span><span>{t(...guide.title)}</span></nav>
    <article>
      <header><div className="section-kicker">{t("PRACTICAL GUIDE · NYTTO LABS", "PRAKTISK GUIDE · NYTTO LABS")}</div><h1>{t(...guide.title)}</h1><p className="guide-intro">{t(...guide.intro)}</p><Link className="primary-button" href={guide.destination}>{t(...guide.cta)} →</Link></header>
      {guide.sections.map(section => <section key={section.title[0]}><h2>{t(...section.title)}</h2><p>{t(...section.body)}</p></section>)}
      <section><h2>{t("Common questions", "Vanliga frågor")}</h2>{guide.questions.map(entry => <details key={entry.question[0]}><summary>{t(...entry.question)}</summary><p>{t(...entry.answer)}</p></details>)}</section>
      <footer><Link className="primary-button" href={guide.destination}>{t(...guide.cta)} →</Link><p><Link href={guidePath(related)}>{t(...related.title)} →</Link></p>{guide.destination === "/#create" && <p><Link href="/bulk">{t("Free bulk label printing", "Gratis utskrift av flera etiketter")}</Link> · <Link href="/care-sheet">{t("Free 12-label Care Sheet", "Gratis Care Sheet med tolv etiketter")}</Link></p>}</footer>
    </article>
  </main>;
}
