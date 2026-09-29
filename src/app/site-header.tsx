"use client";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { LOCALE_PENDING_CLASS, setLocale, useLocale } from "@/lib/locale";
export function SiteHeader() {
  const { locale, t } = useLocale();
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.classList.remove(LOCALE_PENDING_CLASS); }, [locale]);
  const other = locale === "sv" ? "en" : "sv";
  return <header className="site-header no-print"><Link href="/" className="brand" aria-label="StayTag home"><span className="brand-mark" aria-hidden="true"><RefreshCcw size={19} strokeWidth={3} /></span>StayTag</Link><nav className="header-nav" aria-label="Primary"><Link className="header-optional" href="/#how">{t("How it works", "Så fungerar det")}</Link><Link className="header-optional" href="/returns">{t("Returns", "Returer")}</Link><Link className="header-optional" href="/relay">{t("Refill list", "Inköpslista")}</Link><button type="button" className="language-toggle" lang={other} aria-label={other === "sv" ? "Byt till svenska" : "Switch to English"} onClick={() => setLocale(other)}>{other.toUpperCase()}</button><Link className="header-cta" href="/#create">{t("Create label", "Skapa etikett")}</Link></nav></header>;
}
