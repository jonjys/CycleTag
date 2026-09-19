import { careDue, careEvents } from "@/lib/care";
import type { TagPayload } from "@/lib/tag";

export function CareTimeline({ tag }: { tag: TagPayload }) {
  return <div className="care-record">
    <dl className="care-summary">
      <div><dt>Last replaced</dt><dd>{tag.s}</dd></div>
      <div><dt>Next due</dt><dd>{careDue(tag)}</dd></div>
      <div><dt>Exact item</dt><dd>{tag.n}</dd></div>
      <div><dt>Part number</dt><dd>{tag.care?.part || "Not provided"}</dd></div>
    </dl>
    <h2>Care chain</h2>
    <ol className="care-timeline">{careEvents(tag).map((event, index) => <li key={`${index}-${event.s}`}>
      <time dateTime={event.s}>{event.s}</time><strong>{event.n}</strong>
      <span>{event.part ? `Part ${event.part} · ` : ""}{event.i}-day interval</span>
      {event.photo && <details><summary>Photo fingerprint · SHA-256</summary><code className="care-hash">{event.photo}</code></details>}
    </li>)}</ol>
    <p className="care-honesty">Self-reported care history. A photo hash identifies a file; it does not prove when a photo was taken or that maintenance happened. Keep the original photo yourself.</p>
    {!tag.care && <p>This legacy sticker contains a starting date, not a verified maintenance log. Confirm its details when logging your next replacement.</p>}
  </div>;
}
