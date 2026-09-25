"use client";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, ScanLine } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { HomeGenerator } from "./home-generator";
import { TagShelf } from "./tag-shelf";
import { ToolDirectory } from "./tool-directory";
import { SupportNote } from "./support-note";

export function Landing({ sampleUrl, qr }: { sampleUrl: string; qr: string }) {
  const { t } = useLocale();
  return <main className="staytag-home">
    <section className="launch-hero no-print">
      <div className="launch-copy">
        <div className="section-kicker">NYTTO LABS / STAYTAG</div>
        <h1>{t("A little label.", "En liten etikett.")}<br /><em>{t("A longer memory.", "Ett längre minne.")}</em></h1>
        <p>{t("The right filter. The last change. The next one. Keep your machine’s care history on a QR label, ready whenever you scan.", "Rätt filter. Senaste bytet. Nästa datum. Samla maskinens skötselhistorik på en QR-etikett, redo när du skannar.")}</p>
        <a className="primary-button" href="#create">{t("Create a free label", "Skapa gratis etikett")} <ArrowUpRight size={20} aria-hidden="true" /></a>
        <div className="launch-promises"><span><Check size={14} />{t("No account", "Inget konto")}</span><span><Check size={14} />{t("No app", "Ingen app")}</span><span><Check size={14} />{t("Print at home", "Skriv ut hemma")}</span></div>
        <a className="launch-text-link" href={sampleUrl}>{t("Open the working example", "Öppna det fungerande exemplet")} <ArrowUpRight size={16} /></a>
      </div>
      <div className="launch-demo" aria-label={t("Example: a label on a coffee machine opens its care record", "Exempel: etiketten på kaffemaskinen öppnar dess skötselpost")}>
        <div className="demo-caption"><span>{t("ON THE MACHINE", "PÅ MASKINEN")}</span><span>01 — 03</span></div>
        <div className="machine-scene">
          <svg className="coffee-machine" viewBox="0 0 380 340" role="img" aria-label={t("Coffee machine with a scannable QR label", "Kaffemaskin med skanningsbar QR-etikett")}>
            <ellipse cx="193" cy="315" rx="150" ry="16" fill="#082a23" opacity=".3" />
            <rect x="48" y="42" width="240" height="262" rx="25" fill="#e8e2d6" />
            <path d="M260 42h34q24 0 24 24v214q0 24-24 24h-34Z" fill="#a8aaa0" />
            <rect x="68" y="62" width="197" height="43" rx="12" fill="#1b302b" />
            <circle cx="91" cy="83" r="6" fill="#deed99" /><rect x="115" y="77" width="55" height="10" rx="5" fill="#86978a" />
            <circle cx="238" cy="83" r="12" fill="#68776c" /><circle cx="238" cy="83" r="6" fill="#cbd0c2" />
            <rect x="68" y="120" width="111" height="162" rx="10" fill="#253c34" />
            <rect x="104" y="120" width="38" height="54" rx="6" fill="#a3aca1" />
            <rect x="110" y="161" width="8" height="21" rx="4" fill="#101d17" /><rect x="130" y="161" width="8" height="21" rx="4" fill="#101d17" />
            <path d="M94 218h59v22q0 24-30 24t-29-24Z" fill="#f8f4e9" /><path d="M155 222h11q15 22-11 26" fill="none" stroke="#f8f4e9" strokeWidth="8" />
            <rect x="79" y="276" width="88" height="5" rx="2" fill="#84958a" />
            <rect x="192" y="154" width="69" height="95" rx="5" fill="#fffdf5" />
            <image href={qr} x="197" y="159" width="59" height="59" />
            <text x="227" y="234" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#173d2b">StayTag</text>
          </svg>
          <span className="scan-badge"><ScanLine size={18} aria-hidden="true" />{t("Scan the label", "Skanna etiketten")}</span>
        </div>
        <a href={sampleUrl} className="scan-result-card">
          <div className="scan-result-top"><span>{t("YOUR CARE RECORD", "DIN SKÖTSELPOST")}</span><ArrowUpRight size={22} aria-hidden="true" /></div>
          <h2>{t("Coffee machine filter", "Filter till kaffemaskin")}</h2><p>DeLonghi · DLSC002</p>
          <div className="scan-dates"><div><small>{t("Last replaced", "Senast bytt")}</small><strong>01 SEP 2026</strong></div><div><small>{t("Next due", "Nästa byte")}</small><strong>31 OCT 2026</strong></div></div>
          <span className="scan-card-footer"><span className="history-dot" />{t("2 care entries · open history", "2 skötselposter · öppna historik")}</span>
        </a>
        <p className="demo-disclaimer">{t("Example record. Dates are entered by the owner, not verified by StayTag.", "Exempelpost. Ägaren anger datumen; de verifieras inte av StayTag.")}</p>
      </div>
    </section>
    <section id="how" className="launch-how no-print" aria-label={t("How it works", "Så fungerar det")}>
      {[{ n: "01", title: t("Write it once.", "Fyll i en gång."), body: t("Add the exact part and your replacement date.", "Ange rätt del och när du bytte den.") }, { n: "02", title: t("Stick it there.", "Fäst på plats."), body: t("Print on paper. Attach to your machine with tape or sticker paper.", "Skriv ut på papper. Fäst med tejp eller använd etikettpapper.") }, { n: "03", title: t("Know it next time.", "Ha koll nästa gång."), body: t("Scan for the part, care history and a calendar reminder.", "Skanna för rätt del, historik och kalenderpåminnelse.") }].map(step => <article key={step.n}><span>{step.n}</span><div><h2>{step.title}</h2><p>{step.body}</p></div></article>)}
    </section>
    <div className="launch-builder-lead no-print"><span>{t("TRY IT WITH YOUR OWN MACHINE", "TESTA MED DIN EGEN MASKIN")}</span><ArrowDown size={18} aria-hidden="true" /></div>
    <HomeGenerator />
    <section id="sheet" className="launch-sheet no-print"><div><div className="section-kicker">{t("FREE TO PRINT", "GRATIS ATT SKRIVA UT")}</div><h2>{t("One machine? Or the whole room?", "En maskin? Eller hela rummet?")}</h2><p>{t("Single labels, a 12-label Care Sheet with a schedule, and bulk sheets for up to 50 replacements. All free. You provide the paper and printer.", "Enstaka etiketter, ett ark med 12 etiketter och skötselschema, eller upp till 50 ersättningsdelar i bulk. Allt är gratis. Du står för papper och skrivare.")}</p></div><div className="sheet-options"><Link href="/care-sheet">{t("12-label Care Sheet", "Ark med 12 etiketter")} <ArrowUpRight size={22} /></Link><Link href="/bulk">{t("Bulk: up to 50 labels", "Bulk: upp till 50 etiketter")} <ArrowUpRight size={22} /></Link></div></section>
    <TagShelf />
    <section className="launch-faq no-print"><h2>{t("A few things to know.", "Bra att veta.")}</h2>
      <details><summary>{t("Do old stickers update?", "Uppdateras gamla etiketter?")}</summary><p>{t("Each QR is a fixed snapshot. Log a replacement to create a new QR with the previous care entries, then cover the old sticker. Nothing updates remotely.", "Varje QR är en ögonblicksbild. Logga ett byte för att skapa en ny QR med tidigare skötselposter och täck över den gamla etiketten. Inget uppdateras på distans.")}</p></details>
      <details><summary>{t("Where is my information saved?", "Var sparas min information?")}</summary><p>{t("In the QR link and, optionally, My tags in this browser. No account or tag database. Anyone with your link can read the care details. Never include private information. A photo fingerprint stays a fingerprint: the original photo is never uploaded.", "I QR-länken och, om webbläsaren tillåter, i Mina etiketter här på enheten. Inget konto eller etikettdatabas. Alla med länken kan läsa uppgifterna. Lägg aldrig in privat information. Ett fotofingeravtryck är bara ett fingeravtryck; bilden laddas aldrig upp.")}</p></details>
      <details><summary>{t("Does it include the manual?", "Ingår manualen?")}</summary><p>{t("The scan page offers a search for the manual using your item and part number. It does not attach, host or guarantee the correct document.", "Skannsidan erbjuder en sökning efter manualen med delens namn och nummer. Den bifogar eller lagrar ingen manual och garanterar inte rätt dokument.")}</p></details>
      <details><summary>{t("How does StayTag earn money?", "Hur tjänar StayTag pengar?")}</summary><p>{t("You can choose an optional eBay replacement link. Eligible purchases may earn us a commission, at no extra cost to you. There is also voluntary support; it buys no extra features. Labels and printing remain free.", "Du kan välja en valfri eBay-länk för ersättningsdelen. Kvalificerade köp kan ge oss provision utan extra kostnad för dig. Du kan också ge frivilligt stöd, som inte köper några extrafunktioner. Etiketter och utskrift är gratis.")} <Link href="/affiliate">{t("Affiliate disclosure", "Om affiliatelänkar")}</Link></p></details>
    </section>
    <details className="launch-more no-print"><summary>{t("Browse all 24 replacement templates", "Visa alla 24 mallar för ersättningsdelar")}</summary><ToolDirectory /></details>
    <SupportNote />
  </main>;
}
