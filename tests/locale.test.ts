import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_KEY, localeBootScript, readLocale, resolveLocale } from "@/lib/locale";
import { memoryShelfStorage } from "@/lib/shelf";

afterEach(() => vi.unstubAllGlobals());

describe("locale default", () => {
  it("is English with no stored choice, whatever the browser language", () => {
    for (const language of ["sv-SE", "sv", "en-US", "de-DE"]) {
      vi.stubGlobal("navigator", { language, languages: [language] });
      expect(readLocale(memoryShelfStorage())).toBe("en");
    }
  });

  it("uses only an explicit stored choice", () => {
    vi.stubGlobal("navigator", { language: "sv-SE", languages: ["sv-SE"] });
    expect(readLocale(memoryShelfStorage({ initial: { [LOCALE_KEY]: "sv" } }))).toBe("sv");
    expect(readLocale(memoryShelfStorage({ initial: { [LOCALE_KEY]: "en" } }))).toBe("en");
    expect(readLocale(memoryShelfStorage({ initial: { [LOCALE_KEY]: "fr" } }))).toBe("en");
    expect(resolveLocale(null)).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });

  it("falls back to English when storage is blocked", () => {
    expect(readLocale(memoryShelfStorage({ throwOnAccess: true }))).toBe("en");
  });

  it("pre-hydration script only reacts to an explicit Swedish choice, never to navigator", () => {
    expect(localeBootScript).toContain(`localStorage.getItem("${LOCALE_KEY}")==="sv"`);
    expect(localeBootScript).not.toContain("navigator");
  });
});

describe("explicit language link", () => {
  it("lets ?lang=sv or ?lang=en set the choice, and nothing else", () => {
    expect(localeBootScript).toContain('get("lang")');
    expect(localeBootScript).toContain('q==="sv"||q==="en"');
    expect(localeBootScript).not.toContain("navigator");
  });
});
