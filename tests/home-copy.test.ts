import { describe, expect, it } from "vitest";
import { brandsCopy, heroCopy, homepageCopyInventedClaims } from "@/lib/home-copy";

describe("homepage conversion copy", () => {
  it("states the free, no-account QR reorder product", () => {
    const hero = `${heroCopy.body} ${heroCopy.points.join(" ")} ${heroCopy.primaryCta}`.toLowerCase();
    expect(hero).toContain("qr");
    expect(hero).toContain("no account");
    expect(hero).toContain("free");
    expect(hero).toMatch(/toner|filter|descaler/);
    expect(heroCopy.affiliateNote.toLowerCase()).toContain("affiliate");
  });

  it("explains the OEM / pack use without inventing backend features", () => {
    const brands = `${brandsCopy.kicker} ${brandsCopy.title} ${brandsCopy.body} ${brandsCopy.honesty} ${brandsCopy.points.map((point) => `${point.title} ${point.detail}`).join(" ")}`.toLowerCase();
    expect(brands).toContain("oem");
    expect(brands).toContain("private-label");
    expect(brands).toContain("pack");
    expect(brands).toContain("free");
    expect(brands).toContain("no account or database");
    expect(brands).toContain("does not take orders");
    expect(homepageCopyInventedClaims()).toEqual([]);
  });
});
