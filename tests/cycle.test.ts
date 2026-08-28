import { describe, expect, it } from "vitest";
import { calculateCycle } from "@/lib/cycle";

describe("recurring cycle", () => {
  it("finds the next interval deterministically", () => {
    const cycle = calculateCycle("2026-01-01", 30, new Date("2026-02-10T21:00:00Z"));
    expect(cycle.nextDue.toISOString().slice(0, 10)).toBe("2026-03-02");
    expect(cycle.daysUntil).toBe(20);
    expect(cycle.state).toBe("scheduled");
  });

  it("marks an exact cycle date due", () => {
    const cycle = calculateCycle("2026-01-01", 30, new Date("2026-01-31T12:00:00Z"));
    expect(cycle.daysUntil).toBe(0);
    expect(cycle.state).toBe("due");
  });
});
