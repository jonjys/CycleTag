"use client";
import Link from "next/link";
import { useLocale } from "@/lib/locale";
import { moveFaq } from "@/lib/move-faq";

/** Indexable explanation under the planner on the home page: what people search for before a move. */
export function MoveSeo() {
  const { t, locale } = useLocale();
  return <section className="mv-seo no-print" id="how" aria-labelledby="mv-seo-title">
    <h2 id="mv-seo-title">{t("How QR moving box labels work", "Så fungerar QR-etiketter för flyttkartonger")}</h2>
    <ol className="mv-seo-steps">
      <li><strong>{t("Number the box and pick the room.", "Numrera kartongen och välj rum.")}</strong> {t("Each new box gets the next number and a colour band for its room in the new home.", "Varje ny kartong får nästa nummer och ett färgband för rummet i det nya hemmet.")}</li>
      <li><strong>{t("List what's inside.", "Skriv vad som finns i den.")}</strong> {t("Write the things you will look for: kettle, chargers, bedding. Mark fragile or heavy.", "Skriv det du kommer att leta efter: vattenkokare, laddare, sängkläder. Markera ömtåligt eller tungt.")}</li>
      <li><strong>{t("Print and tape.", "Skriv ut och tejpa.")}</strong> {t("Two labels per sheet of plain A4 or US Letter. One on the top, one on the side.", "Två etiketter per ark vanligt A4. En på locket, en på sidan.")}</li>
      <li><strong>{t("Scan or search.", "Skanna eller sök.")}</strong> {t("Any phone camera shows the contents. On your phone, search \"charger\" and get the box number.", "Vilken mobilkamera som helst visar innehållet. I din mobil söker du \"laddare\" och får kartongnumret.")}</li>
    </ol>

    <h2>{t("Why not just a marker pen or a spreadsheet?", "Varför inte bara tuschpenna eller kalkylark?")}</h2>
    <p>{t("\"Kitchen\" on nine boxes tells nobody where the kettle is. A spreadsheet only helps the person who has it open. A QR label puts the full contents on the box itself, so your partner, friends and movers can read it without an app, an account or your file.", "\"Kök\" på nio kartonger säger ingen var vattenkokaren är. Ett kalkylark hjälper bara den som har det öppet. En QR-etikett sätter hela innehållet på kartongen, så att partner, kompisar och flyttfirma kan läsa det utan app, konto eller din fil.")}</p>

    <h2>{t("Built for the people carrying the boxes", "Byggt för de som bär kartongerna")}</h2>
    <p>{t("Helpers see the room colour and a big box number from across the room. Scanning shows everything inside, so nobody opens boxes to sort them, and fragile ones are flagged before they are lifted.", "Hjälparna ser rumsfärg och ett stort kartongnummer på avstånd. En skanning visar allt som finns i kartongen, så ingen öppnar kartonger för att sortera, och ömtåliga syns innan de lyfts.")}</p>

    <h2>{t("Price", "Pris")}</h2>
    <p>{t("Label and print 3 boxes free, including the scan page. A Move Pass is SEK 79 once (about $8 / €7, shown in your currency at checkout) and unlocks unlimited boxes and the full box index for your move. No subscription, no account.", "Märk och skriv ut 3 kartonger gratis, med skanningssidan. Ett Move Pass kostar 79 kr en gång och låser upp obegränsat antal kartonger och hela kartonglistan för flytten. Ingen prenumeration, inget konto.")}</p>

    <h2>{t("Questions", "Vanliga frågor")}</h2>
    <div className="mv-seo-faq">
      {moveFaq.map(f => <details key={f.q[0]}><summary>{locale === "sv" ? f.q[1] : f.q[0]}</summary><p>{locale === "sv" ? f.a[1] : f.a[0]}</p></details>)}
    </div>
    <p className="mv-fine"><Link href="/guides/moving-box-inventory">{t("Moving box inventory guide", "Guide: kartonglista")}</Link> · <Link href="/guides/printable-moving-box-labels">{t("Printable moving labels", "Utskrivbara flyttetiketter")}</Link> · <Link href="/guides/qr-moving-box-labels">{t("How to label moving boxes", "Så märker du flyttkartonger")}</Link> · <Link href="/movers">{t("For moving companies", "För flyttfirmor")}</Link></p>
  </section>;
}
