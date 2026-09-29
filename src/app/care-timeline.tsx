"use client";
import { careDue, careEvents } from "@/lib/care";
import { useLocale } from "@/lib/locale";
import type { TagPayload } from "@/lib/tag";

export function CareTimeline({ tag, compact = false }: { tag: TagPayload; compact?: boolean }) {
  const { t } = useLocale();
  return <div className="care-record">
    {!compact && <dl className="care-summary">
      <div><dt>{t("Last replaced", "Senast bytt")}</dt><dd>{tag.s}</dd></div>
      <div><dt>{t("Next due", "Nästa byte")}</dt><dd>{careDue(tag)}</dd></div>
      <div><dt>{t("Exact item", "Exakt vara")}</dt><dd>{tag.n}</dd></div>
      <div><dt>{t("Part number", "Artikelnummer")}</dt><dd>{tag.care?.part || t("Not provided", "Inte angivet")}</dd></div>
    </dl>}
    <h2>{t("Care chain", "Skötselhistorik")}</h2>
    <ol className="care-timeline" reversed>{careEvents(tag).map((event, index) => ({ event, index })).reverse().map(({ event, index }) => <li key={`${index}-${event.s}`}>
      <time dateTime={event.s}>{event.s}</time><strong>{event.n}</strong>
      <span>{event.part ? `${t("Part", "Del")} ${event.part} · ` : ""}{t(`${event.i}-day interval`, `${event.i} dagars intervall`)}</span>
      {event.photo && <details><summary>{t("Photo fingerprint · SHA-256", "Fotofingeravtryck · SHA-256")}</summary><code className="care-hash">{event.photo}</code></details>}
    </li>)}</ol>
    <p className="care-honesty">{t("Self-reported care history. A photo hash identifies a file; it does not prove when a photo was taken or that maintenance happened. Keep the original photo yourself.", "Självrapporterad skötselhistorik. Ett fotohash identifierar en fil men bevisar inte när bilden togs eller att underhållet gjordes. Spara originalbilden själv.")}</p>
    {!tag.care && <p>{t("This legacy sticker contains a starting date, not a verified maintenance log. Confirm its details when logging your next replacement.", "Den här äldre etiketten innehåller ett startdatum, inte en bekräftad underhållslogg. Kontrollera uppgifterna när du loggar nästa byte.")}</p>}
  </div>;
}
