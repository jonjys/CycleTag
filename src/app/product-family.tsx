"use client";
import Link from "next/link";
import { ArrowUpRight, Boxes, PackageOpen, RefreshCcw, ShoppingBasket, Truck, Undo2 } from "lucide-react";
import { contact } from "@/lib/contact";
import { useLocale } from "@/lib/locale";
import { SiblingProduct } from "./sibling-product";

const packsMail = `mailto:${contact.email.general}?subject=${encodeURIComponent("StayTag label pack enquiry")}&body=${encodeURIComponent("Hello Nytto Labs,\n\nWe would like a quote for StayTag label packs.\nType: landlord / workshop / office / other\nNumber of machines, apartments or spaces:\nBranding needed (logo, colours):\nLanguages:\n\nPlease confirm scope, price and delivery before starting.")}`;

export function ProductFamily() {
  const { t } = useLocale();
  const family = [
    { key: "care", icon: RefreshCcw, href: "#create", name: t("Care", "Skötsel"), title: t("Remember what the machine needs.", "Minns vad maskinen behöver."), body: t("Filter, toner, descaler, vacuum bags. Scan for the exact part and the next date. Changed it? Tap once.", "Filter, toner, avkalkning, dammsugarpåsar. Skanna för rätt del och nästa datum. Bytt? Ett tryck."), cta: t("Create a label", "Skapa etikett") },
    { key: "refill", icon: ShoppingBasket, href: "/relay", name: t("Refill", "Påfyllning"), title: t("Remember what to buy.", "Minns vad som ska köpas."), body: t("Scan the filter, add it to the refill list, send one list to whoever buys. At work: technicians scan, purchasing gets one exact list.", "Skanna filtret, lägg det i inköpslistan, skicka en lista till den som handlar. På jobbet: teknikern skannar, inköp får en exakt lista."), cta: t("Open refill list", "Öppna inköpslistan") },
    { key: "return", icon: Undo2, href: "/returns", name: t("Return", "Retur"), title: t("Remember what has to go back.", "Minns vad som ska tillbaka."), body: t("Return QR codes from any web shop in one place. Days left, one big code at the counter, refund tracked.", "Retur-QR från alla webbutiker på ett ställe. Dagar kvar, en stor kod vid disken, återbetalningen bevakad."), cta: t("Open Return Wallet", "Öppna Returplånboken") },
    { key: "move", icon: Truck, href: "/move", name: t("Move", "Flytt"), title: t("Remember what's in every box.", "Minns vad som finns i varje kartong."), body: t("A QR label per moving box. Scan to see everything inside, search “which box has the kettle?”. 8 boxes free.", "En QR-etikett per flyttkartong. Skanna och se allt innehåll, sök ”vilken kartong har vattenkokaren?”. 8 kartonger gratis."), cta: t("Label your boxes", "Märk dina kartonger") },
    { key: "space", icon: Boxes, href: "/spaces", name: t("Space", "Rum"), title: t("Everything this room needs. One QR.", "Allt rummet behöver. En QR."), body: t("Kitchen, workshop, office, rental flat, coffee station, cleaning closet. Up to six items behind one label on the door.", "Kök, verkstad, kontor, hyreslägenhet, kaffestation, städskåp. Upp till sex saker bakom en etikett på dörren."), cta: t("Create a Space", "Skapa ett rum") }
  ];
  return <>
    <section className="family no-print" aria-labelledby="family-title">
      <div className="family-head">
        <div className="section-kicker">{t("ONE IDEA, FIVE EVERYDAY JOBS", "EN IDÉ, FEM VARDAGSJOBB")}</div>
        <h2 id="family-title">{t("Put memory where the thing is.", "Lägg minnet där saken är.")}</h2>
        <p>{t("Start with one label. Use the rest when you need it — all free, no account, nothing uploaded.", "Börja med en etikett. Använd resten när du behöver det — gratis, inget konto, inget laddas upp.")}</p>
      </div>
      <div className="family-grid">
        {family.map(item => <Link key={item.key} href={item.href} className={`family-card family-${item.key}`}>
          <span className="family-name"><item.icon size={16} aria-hidden="true" /> {item.name}</span>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <span className="family-cta">{item.cta} <ArrowUpRight size={16} aria-hidden="true" /></span>
        </Link>)}
      </div>
      <p className="family-print">{t("Printing for a whole room?", "Skriver du ut för ett helt rum?")} <Link href="/care-sheet">{t("12-label Care Sheet", "Ark med 12 etiketter")}</Link> · <Link href="/bulk">{t("Bulk: up to 50 labels", "Bulk: upp till 50 etiketter")}</Link></p>
    </section>
    <section className="business no-print" aria-labelledby="business-title">
      <div className="business-copy">
        <div className="section-kicker">{t("FOR SELLERS, LANDLORDS & WORKSHOPS", "FÖR SÄLJARE, HYRESVÄRDAR & VERKSTÄDER")}</div>
        <h2 id="business-title">{t("Ship the product with its memory.", "Skicka produkten med sitt minne.")}</h2>
        <p>{t("A refurbished coffee machine, a vintage lamp, a rental flat. The buyer or tenant scans and gets the exact model, the right spare part, care steps and your store link.", "En renoverad kaffemaskin, en vintagelampa, en hyreslägenhet. Köparen eller hyresgästen skannar och får exakt modell, rätt reservdel, skötselråd och din butikslänk.")}</p>
      </div>
      <div className="business-options">
        <Link href="/sellers"><PackageOpen size={20} aria-hidden="true" /><span><strong>{t("Seller Kits", "Säljarkit")}</strong>{t("Free: a reorder card with your SKU and your own store links.", "Gratis: ett återköpskort med ditt artikelnummer och dina egna butikslänkar.")}</span><ArrowUpRight size={18} aria-hidden="true" /></Link>
        <a href={packsMail}><Boxes size={20} aria-hidden="true" /><span><strong>{t("Branded label packs", "Etikettpaket med er logga")}</strong>{t("For apartments, machine parks and workshops. Contact Nytto Labs — scope and price agreed first.", "För lägenheter, maskinparker och verkstäder. Kontakta Nytto Labs — omfattning och pris avtalas först.")}</span><ArrowUpRight size={18} aria-hidden="true" /></a>
        <SiblingProduct />
      </div>
    </section>
  </>;
}
