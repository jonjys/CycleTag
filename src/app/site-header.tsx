"use client";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { setLocale, useLocale } from "@/lib/locale";
export function SiteHeader() {
  const { locale, t } = useLocale();
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <header className="site-header no-print"><Link href="/" className="brand" aria-label="StayTag home"><span className="brand-mark" aria-hidden="true"><RefreshCcw size={19} strokeWidth={3} /></span>StayTag</Link><nav className="header-nav" aria-label="Primary"><Link className="header-optional" href="/#how">{t("How it works", "Så fungerar det")}</Link><Link className="header-optional" href="/care-sheet">{t("Print sheet", "Skriv ut ark")}</Link><label className="language-picker"><span className="sr-only">{t("Language", "Språk")}</span><select aria-label="Language / Språk" value={locale} onChange={e => setLocale(e.target.value === "sv" ? "sv" : "en")}><option value="en">EN</option><option value="sv">SV</option></select></label><Link className="header-cta" href="/#create">{t("Create label", "Skapa etikett")}</Link></nav></header>;
}
