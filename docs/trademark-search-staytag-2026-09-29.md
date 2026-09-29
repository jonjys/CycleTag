# Varumärkessökning: StayTag (2026-09-29)

Syfte: bedöma konfliktrisk för namnet **StayTag** innan produkten flyttas till `staytag.nyttolabs.com`.
Fokus: Nice-klass 9 (programvara/appar), 35 (handel/reklam) och 42 (SaaS/IT-tjänster).
Detta är en automatiserad förhandssökning, inte en juridisk bedömning.

## Status per register

| Register | Nåddes? | Metod | Resultat |
| --- | --- | --- | --- |
| PRV (svenska nationella märken + internationella som designerar SE) | **Ja** | Officiellt sök-API bakom search.prv.se (`dv-search-api.prv.se/searchtrademark/tmsimplesearch/`), kontrollerat med sökningen "volvo" (279 träffar) | 0 träffar på StayTag och nära varianter |
| EUIPO eSearch plus (EU-varumärken) | **Nej** | `euipo.europa.eu/copla/ctmsearch/json` → 302 till `euipo.europa.eu/error/revise.html` (bot-skydd); samma via WebFetch ("Problem detected") | Ej sökt |
| TMview (alla EU-/nationella kontor) | **Nej** | `tmdn.org/tmview/` → 302 till `tmdn.org/error/revise.html`; API gav 503 via WebFetch | Ej sökt |
| WIPO Global Brand Database | **Nej** | API svarade 403 | Ej sökt |

## PRV – sökta termer och träffar

Exakta och förväxlingsbara: `staytag`, `stay tag`, `stay-tag`, `staytags`, `staytagg`, `stay-tagg`, `steytag`, `stagtag`, `staytac`, `staytab`, `saytag`, `skytag`, `playtag`, `waytag`, `daytag`, `staytech`, `staytrack` → **0 träffar**.
`maytag` → 6 träffar, alla avförda (Maytag International, vitvaror).

Bredare delelement, relevanta klasser (9/35/42):

| Märke | Status | Klasser | Innehavare | Ansökningsnr | Bedömning |
| --- | --- | --- | --- | --- | --- |
| Stay (ord) | Registrerad t.o.m. 2027-05-17 | 20, 35, 42 | Lewwel AB | 2017-01946 | 35/42 avser endast köksredskap och köksdesign. Annat område. Låg–måttlig risk |
| STAYPRO / staypro | Registrerad | 1–11, 16–21, 25, 27, 31, 35 m.fl. | Ahlsell AB | 2023-02817 / 2023-02833 | Annat slutled (PRO vs TAG), bygg/installation. Låg |
| STAYTION | Registrerad | 18, 25, 35, 42 | Göteborgs Syfabrik AB | 2021-04585 | Textil. Låg |
| StayFinder | Registrerad | 35, 39, 43 | Logilogik AB | 2021-06025 | Boende. Låg |
| StayHome | Registrerad | 35 | Stay Home and Enjoy AB | 2010-09536 | Låg |
| SwedQual STAY AHEAD | Registrerad | 9 | Sonia Mirkhailullah | 2024-04175 | Låg |
| TAG ON DEMAND | Registrerad | 7, 9, 16, 24, 42 | BEAB etikett & system AB | 2006-07470 | Etikettbransch men annat helhetsintryck. Låg |
| POWERTAG | Registrerad | 9 | Schneider Electric | IntR-2024-0000174 | Låg |
| TAG HEUER | Registrerad | 9 m.fl. | LVMH | 730137 m.fl. | Välkänt märke men annat helhetsintryck. Låg |

Övrigt: "Stay" och "Tag" är vanliga ord med många registreringar. "Tag" är beskrivande för etiketter och ger svagt skydd.

## Webbsökning (tidigare i sessionen)

Inget företag, ingen app och ingen produkt med namnet StayTag hittades. staytag.com är registrerad av okänd part (svarar 503). staytag.se/.eu/.io/.app saknar DNS.

## Samlad risk

- **Sverige (PRV): låg.** Ingen identisk eller nära träff. Närmaste äldre rätt är "Stay" (Lewwel AB) för kök.
- **EU (EUIPO) och övriga kontor (TMview): okänd.** Registren kunde inte nås automatiskt. Här finns den största risken, eftersom ett EU-varumärke gäller i Sverige.

**Beslut:** Flytten till staytag.nyttolabs.com är **stoppad** tills EUIPO/TMview har sökts manuellt.

## Manuell kontroll som återstår (ca 5 min)

1. TMview: https://www.tmdn.org/tmview/welcome → sök `staytag`, sedan `stay tag`. Filtrera Nice-klass 9, 35, 42. Välj alla kontor.
2. EUIPO eSearch plus: https://euipo.europa.eu/eSearch/ → Trade mark name, "contains" `staytag`.
3. Om 0 träffar på exakt/nära namn i 9/35/42 och inget "STAY…"-märke för programvara/QR/etiketter: risken är låg och flytten kan göras.

## Uppföljning (samma dag)

Ägaren genomförde de manuella sökningarna: PRV `StayTag` och `Stay Tag` = 0 träffar; TMview exakt `StayTag` = inga träffar; bredare sökning utan uppenbart relevanta konflikter. Risken bedöms som låg och migreringen till `staytag.nyttolabs.com` genomfördes.
