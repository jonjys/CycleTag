"use client";
import { measurementPayload, type FunnelEvent, type FunnelSource } from "./measurement";
let budgetStart = 0, sent = 0;
export function measure(event: FunnelEvent, source: FunnelSource) {
  if (typeof window === "undefined" || !["cycletag.eu", "www.cycletag.eu"].includes(location.hostname)) return;
  try {
    if (new URLSearchParams(location.search).get("qa") === "1") sessionStorage.setItem("staytag-qa", "1");
    if (sessionStorage.getItem("staytag-qa") === "1") return;
  } catch {}
  if (navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const payload = measurementPayload({ event, source });
  if (!payload) return;
  const now = Date.now(); if (now - budgetStart > 60_000) { budgetStart = now; sent = 0; }
  if (++sent > 40) return;
  // No URL, fragment, item, search phrase, photo hash, identifier or referrer is sent.
  void fetch("/api/metrics", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" }, credentials: "omit", referrerPolicy: "no-referrer", keepalive: true }).catch(() => {});
}
