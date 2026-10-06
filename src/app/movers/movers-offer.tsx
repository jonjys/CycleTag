"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Copy, Mail, Package, ScanLine, Search } from "lucide-react";
import { useLocale } from "@/lib/locale";

export function MoversOffer() {
  const { t, locale } = useLocale();
  const [copied, setCopied] = useState(false);
  const snippet = locale === "sv"
    ? "Tips inför flytten: märk kartongerna med QR-etiketter så hittar du allt direkt. Skanna en kartong och se vad som finns i den, eller sök \"laddare\" i mobilen. Gratis för 3 kartonger, ingen app: https://staytag.nyttolabs.com/move?lang=sv"
    : "Moving tip: label your boxes with QR codes and find anything in seconds. Scan a box to see what's inside, or search your phone for \"charger\". Free for 3 boxes, no app: https://staytag.nyttolabs.com/move";
  const copy = async () => { try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { setCopied(false); } };
  return <>
    <section className="mvp-hero">
      <div className="section-kicker">{t("FOR MOVING COMPANIES", "FÖR FLYTTFIRMOR")}</div>
      <h1>{t("Give every customer boxes they can find things in.", "Ge varje kund kartonger där de hittar sina saker.")}</h1>
      <p>{t("StayTag Move turns each moving box into a numbered QR label with the room, contents and fragile/heavy flags. Your customer scans a box and sees what is inside, or searches their phone for \"charger\" and gets the box number. No app, no account, nothing to integrate.", "StayTag Move gör varje flyttkartong till en numrerad QR-etikett med rum, innehåll och ömtåligt/tungt. Kunden skannar en kartong och ser vad som finns i den, eller söker \"laddare\" i mobilen och får kartongnumret. Ingen app, inget konto, inget att integrera.")}</p>
      <div className="mvp-actions"><Link className="primary-button" href="/move">{t("Try it free (3 boxes)", "Testa gratis (3 kartonger)")}</Link><a className="secondary-button" href="#add">{t("Add it for your customers", "Lägg till för era kunder")}</a></div>
    </section>

    <section className="mvp-how" aria-label={t("How it works for your customers", "Så fungerar det för era kunder")}>
      <div><Package size={22} aria-hidden="true" /><h2>{t("Pack and label", "Packa och märk")}</h2><p>{t("The customer lists what goes in each box and prints labels on plain A4 or US Letter. Two per page.", "Kunden skriver vad som ligger i varje kartong och skriver ut etiketter på vanligt A4. Två per sida.")}</p></div>
      <div><ScanLine size={22} aria-hidden="true" /><h2>{t("Your crew scans", "Er personal skannar")}</h2><p>{t("Room colour and box number are readable at a glance. A phone camera shows the full contents, so nobody opens boxes to sort them.", "Rumsfärg och nummer syns direkt. Mobilkameran visar hela innehållet, så ingen behöver öppna kartonger för att sortera.")}</p></div>
      <div><Search size={22} aria-hidden="true" /><h2>{t("Unpacking is faster", "Uppackningen går fortare")}</h2><p>{t("The customer searches every box from their phone and prints a box index as a paper backup.", "Kunden söker bland alla kartonger i mobilen och skriver ut en kartonglista som pappersreserv.")}</p></div>
    </section>

    <section className="mvp-packs" id="add" aria-labelledby="mvp-add-title">
      <h2 id="mvp-add-title">{t("Free to add to your booking confirmation", "Gratis att lägga in i er bokningsbekräftelse")}</h2>
      <p className="mvp-lead">{t("Paste this into the email your customers get after booking. It costs you nothing, needs no account and gives customers a better-organised move.", "Klistra in det här i mejlet kunden får efter bokningen. Det kostar er ingenting, kräver inget konto och ger kunden en mer organiserad flytt.")}</p>
      <blockquote className="mvp-snippet">{snippet}</blockquote>
      <div className="mvp-actions"><button type="button" className="primary-button" onClick={copy}>{copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />} {copied ? t("Copied", "Kopierat") : t("Copy text", "Kopiera texten")}</button></div>
      <ul className="mvp-terms">
        <li><Check size={16} aria-hidden="true" /> {t("Customers label 3 boxes free. A full move is a one-time Move Pass (SEK 79), paid by the customer.", "Kunden märker 3 kartonger gratis. En hel flytt kostar ett Move Pass (79 kr) som kunden betalar en gång.")}</li>
        <li><Check size={16} aria-hidden="true" /> {t("Box lists stay on the customer's phone. We never see or store their contents.", "Kartonglistorna stannar i kundens mobil. Vi ser eller sparar aldrig innehållet.")}</li>
        <li><Check size={16} aria-hidden="true" /> {t("Want to cover the Move Pass for your customers, or need volume pricing? Tell us your monthly moves and we will send an offer.", "Vill ni bjuda kunderna på Move Pass eller behöver volympris? Berätta hur många flyttar ni gör per månad så skickar vi ett erbjudande.")}</li>
      </ul>
      <p className="mvp-fine"><a href="mailto:hello@nyttolabs.com?subject=StayTag%20Move%20for%20movers"><Mail size={14} aria-hidden="true" /> hello@nyttolabs.com</a></p>
    </section>
  </>;
}
