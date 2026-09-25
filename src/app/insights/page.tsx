import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mätning och beslut", robots: { index: false, follow: false } };
export default function Insights() {
  return <main className="legal-page" lang="sv"><article>
    <div className="section-kicker">STAYTAG / ÄGARGUIDE</div><h1>Vad händer efter klicket?</h1>
    <p>Ingen publik statistik visas här. Siffrorna finns i dina egna Vercel-, eBay- och Stripe-konton. Mätningen börjar med denna version; gamla besök går inte att återskapa.</p>
    <h2>1. Besök och handlingar: Vercel</h2>
    <p>Öppna projektet <strong>cycletag → Logs</strong>. Välj Production, önskat tidsintervall och sök <code>staytag_event</code>. Filtrera på <code>/api/metrics</code>. Räkna loggmeddelanden med respektive event nedan, inte alla HTTP-anrop.</p>
    <ul><li><code>page_view</code> + <code>source: home</code>: startsidan visades med JavaScript.</li><li><code>label_started</code>: någon började använda formuläret.</li><li><code>label_created</code>: en QR skapades; bulk räknas som en omgång.</li><li><code>print_requested</code>: utskriftsdialogen öppnades, inte bevis på utskrivet papper.</li><li><code>png_downloaded</code>: nedladdning begärdes.</li><li><code>outbound_ebay</code>: en eBay-länk aktiverades.</li><li><code>support_checkout_opened</code>: stödkassan öppnades, inte en betalning.</li></ul>
    <p>Detta är handlingar, inte unika människor eller sammanlänkade personresor. Omladdningar kan ge fler besök; integritetsskydd och nätfel kan ge bortfall. Do Not Track och Global Privacy Control respekteras. Öppna sidan med <code>?qa=1</code> för egna tester: den fliken räknas därefter inte.</p>
    <p><strong>Spara resultaten innan loggarna försvinner.</strong> Vercels lagringstid beror på abonnemanget; kontrollera den i ditt konto. Kort logglagring ger ingen komplett sjudagarsrapport. Exportera inom lagringstiden eller konfigurera beständig lagring av enbart dessa fasta event innan ett längre test. Ingen sådan betaltjänst aktiveras automatiskt.</p>
    <h2>2. Registrerade affiliateklick: eBay</h2>
    <p>I eBay Partner Network: välj kampanj <strong>5339198614</strong>, samma datum och tidszon. Jämför registrerade klick med <code>outbound_ebay</code>. Custom ID börjar med <code>cycletag-scan-</code>, <code>cycletag-instant-</code> eller <code>cycletag-printer-</code>; äldre prefix bevaras avsiktligt. Kontrollera även andra verktygs prefix om de används.</p>
    <p>En korrekt märkt länk och ett butiksklick bevisar inte att EPN registrerat klicket eller att någon köpt. EPN:s rapportering och kvalificeringsregler avgör provision. Startsidesbesök utan butiksklick ska inte synas som EPN-klick.</p>
    <h2>3. Riktiga betalningar: Stripe</h2>
    <p>Öppna Payment Links → <strong>Support CycleTag</strong> (det tidigare namnet). Kontrollera lyckade betalningar för just denna länk under testperioden. Länken tar frivilligt stöd från 49 SEK och levererar ingen betalprodukt. En startad eller slutförd kassa med obetald status räknas inte som intäkt. Kontrollera också återbetalningar.</p>
    <h2>Beslut efter ett avgränsat test</h2>
    <p>Testa i sju dagar med en tydlig målgrupp: personer som faktiskt sköter flera maskiner. Bestäm i förväg hur besök ska räknas över hela perioden. Utan tillräcklig relevant trafik går betalviljan inte att bedöma.</p>
    <p>Få besök: arbeta med distribution. Besök men få påbörjade etiketter: erbjudandet eller målgruppen brister. Många starter men få skapade: undersök formulärfel. Skapade etiketter utan butiksklick: det kan vara normal användning av skötselhistorik. Butiksklick utan EPN-klick: granska attribution. Ingen verifierad betalvilja efter testet: pausa vidare utveckling och behåll gratisverktyget.</p>
    <p><strong>Ingen färdig betalprodukt finns i denna version.</strong> Sälj inte gratis PDF- eller bulkfunktioner som ett paket. Ett möjligt senare erbjudande är en manuellt färdigställd etikettuppsättning, men endast efter att omfattning, pris, faktisk leverans och kundens intresse har bekräftats.</p>
  </article></main>;
}
