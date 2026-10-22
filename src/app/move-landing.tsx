"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Package, RotateCcw } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/locale";
import { getMoveSnapshot, getServerSnapshot, parseMove, subscribeMove } from "@/lib/move";

const demoRooms = [["Kitchen", "Kök"], ["Bedroom", "Sovrum"], ["Living room", "Vardagsrum"]] as const;

/** The landing explains one job. Packing and sharing live in the app. */
export function MoveLanding() {
  const { t } = useLocale();
  const raw = useSyncExternalStore(subscribeMove, getMoveSnapshot, getServerSnapshot);
  const returning = raw ? parseMove(raw).move.boxes.length > 0 : false;
  const [arrived, setArrived] = useState<number[]>([1]);
  const count = arrived.length, complete = count === 3;
  const start = returning ? t("Continue my move", "Fortsätt min flytt") : t("Start my move — free", "Starta min flytt — gratis");
  return <main className="ml-page">
    <section className="ml-hero" aria-labelledby="ml-title"><div className="ml-copy">
      <p className="ml-eyebrow"><span />{t("A LITTLE LESS MOVING CHAOS", "LITE MINDRE FLYTTKAOS")}</p>
      <h1 id="ml-title">{t("Every box.", "Varje kartong.")}<br /><em>{t("Home.", "Hemma.")}</em></h1>
      <p className="ml-description">{t("Snap the open box and AI lists what's inside. Print the QR label. Share the carrying and see every box arrive.", "Fota kartongen så listar AI innehållet. Skriv ut QR-etiketten. Dela på bärandet och se varje kartong komma fram.")}</p>
      <Link className="ml-cta" href="/move">{start}<ArrowUpRight size={23} aria-hidden="true" /></Link>
      <p className="ml-micro">{t("3 boxes free. No app. No account.", "3 kartonger gratis. Ingen app. Inget konto.")}</p>
      <p className="ml-scroll-note">{t("THE LAST BOX FEELS GOOD.", "SISTA KARTONGEN KÄNNS BRA.")}</p>
    </div>
    <div className={`ml-scene${complete ? " ml-all-home" : ""}`} aria-label={t("Interactive demo: tap the boxes to check them into the new home", "Interaktiv demo: tryck på kartongerna för att pricka av dem i nya hemmet")}>
      <div className="ml-scene-top"><span className="ml-demo-label"><span />{t("INTERACTIVE DEMO", "INTERAKTIV DEMO")}</span><span className="ml-manifest-number">ST–003</span></div>
      <svg className="ml-scene-lines" viewBox="0 0 600 540" fill="none" aria-hidden="true"><path d="M-40 420C70 480 110 520 270 465C410 410 450 300 650 325" stroke="#568b72" strokeWidth="1.5" strokeDasharray="5 9" /><path d="M-60 445C70 505 125 548 290 490C430 440 470 320 650 350" stroke="#568b72" opacity=".3" /><path d="M423 142V83l47-35 47 35v59M408 96l62-46 62 46M453 142v-35h33v35" stroke="#75a58a" strokeWidth="1.4" /><circle cx="470" cy="120" r="94" stroke="#75a58a" opacity=".17" /><circle cx="470" cy="120" r="119" stroke="#75a58a" opacity=".1" /></svg>
      <div className="ml-scene-heading"><span>{t("NEXT STOP", "NÄSTA STOPP")}</span><strong>{t("Your new place.", "Ditt nya hem.")}</strong></div>
      <div className="ml-cargo" role="group" aria-label={t("Demo boxes", "Demokartonger")}>{demoRooms.map((room, i) => {
        const n = i + 1, checked = arrived.includes(n);
        return <button type="button" key={n} className={`ml-cargo-box ml-cargo-${n}${checked ? " is-home" : ""}`} aria-pressed={checked} aria-label={checked ? t(`Demo: undo arrival of box ${n}`, `Demo: ångra ankomst för kartong ${n}`) : t(`Demo: check box ${n} into the new home`, `Demo: pricka av kartong ${n} i nya hemmet`)} onClick={() => setArrived(current => current.includes(n) ? current.filter(x => x !== n) : [...current, n])}>
          <CargoBox n={n} room={t(room[0], room[1])} checked={checked} /><span className="ml-box-state">{checked ? <Check size={13} aria-hidden="true" /> : <span className="ml-box-plus" aria-hidden="true">+</span>}{checked ? t("HOME", "HEMMA") : t("CHECK IN", "PRICKA AV")}</span>
        </button>;
      })}</div>
      <div className="ml-arrival-card" aria-live="polite"><div className="ml-arrival-icon">{complete ? <Check size={25} aria-hidden="true" /> : <Package size={25} aria-hidden="true" />}</div><div><strong>{complete ? t("All accounted for.", "Alla på plats.") : t(`${count} of 3 boxes home.`, `${count} av 3 kartonger hemma.`)}</strong><span>{complete ? t("That's one less thing to worry about.", "En sak mindre att oroa sig för.") : t("Tap a box. Watch the count change.", "Tryck på en kartong. Se antalet ändras.")}</span></div><span className="ml-arrival-fraction" aria-hidden="true">{count}<small>/3</small></span></div>
      <div className="ml-scene-bottom"><span>{t("A SHARED CHECK. NOT A GUESS.", "GEMENSAM KOLL. INGA GISSNINGAR.")}</span><button type="button" onClick={() => setArrived([1])} aria-label={t("Reset interactive demo", "Återställ interaktiv demo")}><RotateCcw size={15} aria-hidden="true" /></button></div><span className="ml-sticker" aria-hidden="true">{complete ? "✓" : "↗"}</span>
    </div></section>
    <section className="ml-process" id="how" aria-label={t("How StayTag works", "Så fungerar StayTag")}>
      <div><span>01</span><p><strong>{t("Snap & label.", "Fota & märk.")}</strong><small>{t("AI lists the box from one photo. Print the QR, search \"keys\" later.", "AI listar kartongen från ett foto. Skriv ut QR-koden, sök \"nycklar\" sen.")}</small></p></div><ArrowRight className="ml-step-arrow" size={21} aria-hidden="true" />
      <div><span>02</span><p><strong>{t("Share the move.", "Dela flytten.")}</strong><small>{t("One helper link. The same box checks.", "En hjälparlänk. Samma avprickningar.")}</small></p></div><ArrowRight className="ml-step-arrow" size={21} aria-hidden="true" />
      <div><span>03</span><p><strong>{t("Leave nothing behind.", "Lämna inget kvar.")}</strong><small>{t("See what's loaded and what's arrived.", "Se vad som lastats och kommit fram.")}</small></p></div>
    </section>
    <section className="ml-price" aria-labelledby="ml-price-title"><div><p className="ml-eyebrow">{t("NO SUBSCRIPTION. JUST YOUR MOVE.", "INGEN PRENUMERATION. BARA DIN FLYTT.")}</p><h2 id="ml-price-title">{t("Big move.", "Stor flytt.")} <em>{t("Small price.", "Litet pris.")}</em></h2><p>{t("Try 3 boxes free. Move Pass unlocks the rest.", "Testa 3 kartonger gratis. Move Pass låser upp resten.")}</p></div><div className="ml-price-amount"><strong>79<small>SEK</small></strong><span>{t("once · helpers included", "en gång · hjälparna ingår")}</span></div><Link className="ml-price-go" href="/move" aria-label={start}><ArrowUpRight size={32} aria-hidden="true" /></Link></section>
    <div className="ml-small-links"><Link href="/movers">{t("Moving company? This is for your customers, too.", "Flyttfirma? Det här är för era kunder också.")}<ArrowUpRight size={14} aria-hidden="true" /></Link><Link href="/moving-house-checklist">{t("Free moving checklist", "Gratis flyttchecklista")}</Link></div>
  </main>;
}

function CargoBox({ n, room, checked }: { n: number; room: string; checked: boolean }) {
  return <svg viewBox="0 0 230 230" fill="none" aria-hidden="true"><ellipse cx="115" cy="202" rx="88" ry="18" fill="#061c16" opacity=".2" />
    <path d="M23 70L113 27L207 70L117 116L23 70Z" fill={checked ? "#b9d7ad" : "#e1b782"} stroke="#6b5034" strokeLinejoin="round" />
    <path d="M23 70L117 116V209L23 162V70Z" fill={checked ? "#a5c999" : "#c48b57"} stroke="#6b5034" strokeLinejoin="round" />
    <path d="M117 116L207 70V162L117 209V116Z" fill={checked ? "#87b280" : "#ae7346"} stroke="#6b5034" strokeLinejoin="round" />
    <path d="M68 49L161 93L161 135L174 128V87L82 42L68 49Z" fill={checked ? "#dce9cb" : "#eed7a7"} fillOpacity=".85" />
    <path d="M31 79L109 118V184L31 145V79Z" fill="#f8f5e9" />
    <g transform="matrix(1 .5 0 1 40 88)"><rect width="59" height="11" fill={n === 1 ? "#e46839" : n === 2 ? "#285d7c" : "#5f7046"} /><text x="4" y="8" fill="#fff" fontSize="6.5" fontFamily="Arial" fontWeight="700">{room.toUpperCase()}</text><text x="0" y="46" fill="#1d3028" fontSize="34" fontFamily="Arial" fontWeight="900">0{n}</text><path d="M2 54H55M2 58H39" stroke="#b6b4a8" /></g>
    <path d="M133 154L147 147V162L133 169V154ZM137 158L139 160L144 152" stroke="#e6c59a" strokeWidth="1.5" /><path d="M122 123V200M201 80V158" stroke="#805335" strokeOpacity=".4" />
  </svg>;
}
