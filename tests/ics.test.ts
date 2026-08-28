import { describe, expect, it } from "vitest";
import { createIcs } from "@/lib/ics";
import type { TagPayload } from "@/lib/tag";

describe("calendar output", () => {
  it("creates a recurring RFC-style calendar event", () => {
    const tag: TagPayload = { v: 1, n: "Water filter", q: "filter; special", c: "water", i: 180, s: "2026-01-01", m: "UK" };
    const ics = createIcs(tag, "https://example.com/tag?d=abc");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260630");
    expect(ics).toContain("RRULE:FREQ=DAILY;INTERVAL=180");
    expect(ics).toContain("SUMMARY:Replace or reorder Water filter");
    expect(ics).toContain("URL:https://example.com/tag?d=abc");
  });
});
