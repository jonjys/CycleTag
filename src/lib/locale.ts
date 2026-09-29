"use client";
import { useSyncExternalStore } from "react";
export type Locale = "en" | "sv";
export const LOCALE_KEY = "staytag-language";
/** Class set before paint for visitors who chose Swedish, so English text never flashes. */
export const LOCALE_PENDING_CLASS = "staytag-sv-pending";

/** English unless the visitor explicitly chose Swedish. Browser/device language is deliberately ignored. */
export function resolveLocale(stored: string | null | undefined): Locale {
  return stored === "sv" ? "sv" : "en";
}

export function readLocale(storage?: Pick<Storage, "getItem">): Locale {
  try { return resolveLocale((storage ?? localStorage).getItem(LOCALE_KEY)); } catch { return "en"; }
}

/** Inline, pre-hydration script: hides the page only for visitors who explicitly chose Swedish, until React renders Swedish. */
export const localeBootScript = `try{if(localStorage.getItem(${JSON.stringify(LOCALE_KEY)})==="sv"){var d=document.documentElement;d.lang="sv";d.classList.add(${JSON.stringify(LOCALE_PENDING_CLASS)});setTimeout(function(){d.classList.remove(${JSON.stringify(LOCALE_PENDING_CLASS)})},1500)}}catch(e){}`;

function subscribe(fn: () => void) {
  window.addEventListener("storage", fn); window.addEventListener("staytag-language", fn);
  return () => { window.removeEventListener("storage", fn); window.removeEventListener("staytag-language", fn); };
}
let sessionLocale: Locale | undefined;
export function setLocale(locale: Locale) {
  sessionLocale = locale;
  try { localStorage.setItem(LOCALE_KEY, locale); } catch {}
  window.dispatchEvent(new Event("staytag-language"));
}
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, () => sessionLocale ?? readLocale(), () => "en" as Locale);
  return { locale, t: (en: string, sv: string) => locale === "sv" ? sv : en };
}
