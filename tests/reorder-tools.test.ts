import { describe, expect, it } from "vitest";
import { getReorderTool, reorderToolPath, reorderTools } from "@/lib/reorder-tools";
import { siteUrl } from "@/lib/site";
import { validateTag } from "@/lib/tag";

describe("searchable reorder tools", () => {
  it("publishes twenty-four unique, valid generator routes", () => {
    expect(reorderTools).toHaveLength(24);
    expect(new Set(reorderTools.map(({ slug }) => slug)).size).toBe(reorderTools.length);

    for (const tool of reorderTools) {
      expect(reorderToolPath(tool)).toBe(`/reorder-label/${tool.slug}`);
      expect(getReorderTool(tool.slug)).toEqual(tool);
      expect(validateTag({ v: 1, n: tool.preset.name, q: tool.preset.query, c: tool.preset.category, i: tool.preset.interval, s: "2026-08-28", m: "DE" })).not.toBeNull();
    }
  });

  it("uses the owned EU domain as the canonical origin", () => {
    expect(siteUrl).toBe("https://cycletag.eu");
  });
});
