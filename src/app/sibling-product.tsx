"use client";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/locale";

/** Nytto Labs sibling product. StayTag QR codes remember things; Curl-to-Buy links sell things. They stay separate. */
export const curlToBuyUrl = "https://pay.nyttolabs.com/";

export function SiblingProduct({ className = "" }: { className?: string }) {
  const { t } = useLocale();
  return <aside className={`sibling-product no-print ${className}`} aria-label={t("Another tool from Nytto Labs", "Ett annat verktyg från Nytto Labs")}>
    <span className="sibling-kicker">{t("Different job? Also from Nytto Labs", "Ett annat jobb? Också från Nytto Labs")}</span>
    <p><strong>{t("Selling something instead?", "Ska du sälja något i stället?")}</strong> {t("Curl-to-Buy turns a file into a payment and download link.", "Curl-to-Buy gör en fil till en betal- och nedladdningslänk.")}</p>
    <a href={curlToBuyUrl} target="_blank" rel="noopener">{t("Open Curl-to-Buy", "Öppna Curl-to-Buy")} <ArrowUpRight size={15} aria-hidden="true" /><span className="sr-only"> {t("(opens in a new tab)", "(öppnas i ny flik)")}</span></a>
  </aside>;
}
