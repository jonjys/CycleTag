"use client";
import { useSyncExternalStore } from "react";
export type Locale = "en" | "sv";
function snapshot(): Locale {
  try { const saved = localStorage.getItem("staytag-language"); if (saved === "en" || saved === "sv") return saved; } catch {}
  return navigator.language.toLowerCase().startsWith("sv") ? "sv" : "en";
}
function subscribe(fn: () => void) {
  window.addEventListener("storage", fn); window.addEventListener("staytag-language", fn);
  return () => { window.removeEventListener("storage", fn); window.removeEventListener("staytag-language", fn); };
}
let sessionLocale: Locale | undefined;
export function setLocale(locale: Locale) {
  sessionLocale = locale;
  try { localStorage.setItem("staytag-language", locale); } catch {}
  window.dispatchEvent(new Event("staytag-language"));
}
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, () => sessionLocale ?? snapshot(), () => "en" as Locale);
  return { locale, t: (en: string, sv: string) => locale === "sv" ? sv : en };
}
