"use client";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Cookieless page-view counts. Never sends query strings or fragments, and sends nothing under Do Not Track or GPC. */
export function beforeSend(event: BeforeSendEvent, nav: { doNotTrack?: string | null; globalPrivacyControl?: boolean } = typeof navigator === "undefined" ? {} : navigator as never): BeforeSendEvent | null {
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return null;
  const url = new URL(event.url);
  return { ...event, url: `${url.origin}${url.pathname}` };
}

export function WebAnalytics() { return <Analytics beforeSend={event => beforeSend(event)} />; }
