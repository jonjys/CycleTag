import type { TagPayload } from "./tag";

function compactDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\r?\n/g, "\\n");
}

export function createIcs(tag: TagPayload, tagUrl: string): string {
  const first = new Date(`${tag.s}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() + tag.i);
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `cycletag-${encodeURIComponent(tag.q).slice(0, 40)}@cycletag`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CycleTag//Recurring reorder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${compactDate(first)}`,
    `DTEND;VALUE=DATE:${compactDate(new Date(first.getTime() + 86_400_000))}`,
    `RRULE:FREQ=DAILY;INTERVAL=${tag.i}`,
    `SUMMARY:${escapeIcs(`${tag.care ? "Care due:" : "Replace or reorder"} ${tag.n}`)}`,
    `DESCRIPTION:${escapeIcs(`Read the care history and log a replacement: ${tagUrl}`)}`,
    `URL:${escapeIcs(tagUrl)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
    ""
  ].join("\r\n");
}
