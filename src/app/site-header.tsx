"use client";
import Link from "next/link";
import { ArrowUpRight, Package, RefreshCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { LOCALE_PENDING_CLASS, setLocale, useLocale } from "@/lib/locale";
export function SiteHeader() {
  const { locale, t } = useLocale();
  const home = usePathname() === "/";
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.classList.remove(LOCALE_PENDING_CLASS); }, [locale]);
  return <header className={`site-header no-print${home ? " ml-site-header" : ""}`}><Link href="/" className="brand" aria-label="StayTag home"><span className="brand-mark" aria-hidden="true">{home ? <Package size={20} strokeWidth={2} /> : <RefreshCcw size={19} strokeWidth={3} />}</span>StayTag</Link><nav className="header-nav" aria-label="Primary">{!home && <><Link className="header-optional" href="/#how">{t("How it works", "Så fungerar det")}</Link><Link className="header-optional" href="/movers">{t("For movers", "Flyttfirmor")}</Link></>}<div className="language-toggle" role="group" aria-label="Language / Språk">{(["en", "sv"] as const).map(code => <button key={code} type="button" lang={code} aria-pressed={locale === code} aria-label={code === "sv" ? "Svenska" : "English"} onClick={() => setLocale(code)}>{code.toUpperCase()}</button>)}</div><Link className={home ? "ml-open-app" : "header-cta"} href="/move">{home ? t("Open app", "Öppna appen") : t("My move", "Min flytt")}{home && <ArrowUpRight size={13} aria-hidden="true" />}</Link></nav></header>;
}
