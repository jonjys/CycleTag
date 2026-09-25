"use client";
import { useLocale } from "@/lib/locale";
import { supportPaymentUrl } from "@/lib/commerce";
export function SupportNote() {
  const { t } = useLocale();
  return <aside className="support-note no-print"><div><strong>{t("Useful? Help keep it free.", "Till nytta? Hjälp oss hålla det gratis.")}</strong><p>{t("Optional one-time support from SEK 49, charged in SEK. No product, stickers or extra features are included. Checkout still uses our former name, CycleTag.", "Frivilligt engångsstöd från 49 kr, debiteras i SEK. Ingen produkt, klisteretikett eller extrafunktion ingår. I kassan står vårt tidigare namn, CycleTag.")}</p></div><a href={supportPaymentUrl} data-support-link="true" target="_blank" rel="noopener noreferrer">{t("Support StayTag ↗", "Stöd StayTag ↗")}</a></aside>;
}
