"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/locale";
import { contact, contactLinks, operatorLegalLine } from "@/lib/contact";

export function SiteFooter() {
  const home = usePathname() === "/";
  const { t } = useLocale();
  return <footer className={`site-footer no-print${home ? " ml-footer" : ""}`}>
    <div className="footer-about"><a href={contactLinks.operator}>StayTag · {contact.operatorName}, {contact.country}</a></div>
    <nav aria-label="Support and legal"><Link href="/privacy">{t("Privacy", "Integritet")}</Link><Link href="/terms">{t("Terms", "Villkor")}</Link><a href={contactLinks.general}>{t("Contact", "Kontakt")}</a>
      <details><summary>{t("More", "Mer")}</summary><div><p>{operatorLegalLine}</p><Link href="/support">Support</Link><Link href="/movers">{t("For moving companies", "För flyttfirmor")}</Link><Link href="/moving-house-checklist">{t("Moving checklist", "Flyttchecklista")}</Link><Link href="/guides/qr-moving-box-labels">QR moving box guide</Link><Link href="/guides/moving-box-inventory">Moving box inventory</Link><Link href="/guides/printable-moving-box-labels">Printable moving labels</Link><Link href="/labels">{t("Other StayTag tools", "Andra StayTag-verktyg")}</Link><Link href="/returns">Return Wallet</Link><Link href="/care-sheet">Care Sheet</Link><Link href="/bulk">Bulk</Link><Link href="/spaces">Spaces</Link><Link href="/relay">Refill Relay</Link><Link href="/sellers">Seller Kits</Link><Link href="/guides/qr-maintenance-labels">Maintenance label guide</Link><Link href="/insights">Measurement guide</Link><Link href="/affiliate">Affiliate disclosure</Link></div></details>
    </nav>
  </footer>;
}
