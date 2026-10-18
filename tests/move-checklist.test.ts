import { describe, expect, it } from "vitest";
import { emptyChecklist, parseChecklist, phaseDate, validDate } from "../src/lib/move-checklist";

describe("moving checklist persistence", () => {
  it("loads a new list and round-trips dates, completion and custom tasks", () => {
    expect(parseChecklist(null)).toEqual({ value: emptyChecklist(), damaged: false });
    const value = { date: "2026-11-01", done: ["transport", "custom-abc"], custom: [{ id: "custom-abc", text: "Leave spare keys", phase: "day" }] };
    expect(parseChecklist(JSON.stringify(value))).toEqual({ value, damaged: false });
  });
  it.each([
    "{", "null", JSON.stringify({ date: "2026-02-30", done: [], custom: [] }),
    JSON.stringify({ date: "", done: ["unknown"], custom: [] }),
    JSON.stringify({ date: "", done: [], custom: [{ id: "custom-a", text: "", phase: "day" }] }),
    JSON.stringify({ date: "", done: [], custom: [{ id: "custom-a", text: "Keys", phase: "unknown" }] }),
    JSON.stringify({ date: "", done: [], custom: Array.from({ length: 51 }, (_, i) => ({ id: `custom-${i}`, text: "Task", phase: "day" })) }),
  ])("recovers safely from damaged or oversized storage: %s", raw => {
    expect(parseChecklist(raw)).toEqual({ value: emptyChecklist(), damaged: true });
  });
  it("rejects duplicated custom IDs", () => {
    const task = { id: "custom-a", text: "Keys", phase: "day" };
    expect(parseChecklist(JSON.stringify({ date: "", done: [], custom: [task, task] })).damaged).toBe(true);
  });
});

describe("planning dates", () => {
  it("handles month, year and leap-day boundaries without timezone drift", () => {
    expect(phaseDate("2026-01-03", -7)).toBe("2025-12-27");
    expect(phaseDate("2028-03-07", -7)).toBe("2028-02-29");
    expect(phaseDate("2026-10-28", -7)).toBe("2026-10-21");
    expect(phaseDate("2026-12-29", 7)).toBe("2027-01-05");
  });
  it("returns no suggestion for absent, impossible or out-of-range dates", () => {
    expect(phaseDate("", -28)).toBeNull();
    expect(validDate("2026-02-29")).toBe(false);
    expect(phaseDate("9999-12-31", 7)).toBeNull();
    expect(phaseDate("1900-01-01", -28)).toBeNull();
  });
});
