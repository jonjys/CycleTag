export * from "../../supabase/functions/_shared/moving-day";

import type { ShareCredentials, SharedResult } from "../../supabase/functions/_shared/moving-day";
import { isShareId, isShareKey } from "../../supabase/functions/_shared/moving-day";

export const SHARE_STORAGE = "staytag.moving-day.v1";
export const SHARE_EVENT = "staytag:moving-day";
export async function shareKeyId(key: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(hash).slice(0, 6), b => b.toString(16).padStart(2, "0")).join("");
}
export function newShareKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function parseShare(value: string | null): ShareCredentials | null {
  try {
    const v = JSON.parse(value ?? "null");
    if (!v || !isShareId(v.id) || !isShareKey(v.key)) return null;
    return { id: v.id, key: v.key, ...(isShareKey(v.helper) ? { helper: v.helper } : {}), ...(typeof v.expiresAt === "string" && Number.isFinite(Date.parse(v.expiresAt)) ? { expiresAt: v.expiresAt } : {}) };
  } catch { return null; }
}
export function getShareSnapshot(): string | null { try { return localStorage.getItem(SHARE_STORAGE); } catch { return null; } }
export const getShareServerSnapshot = () => null;
export function subscribeShare(callback: () => void) {
  window.addEventListener("storage", callback); window.addEventListener(SHARE_EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(SHARE_EVENT, callback); };
}
export function saveShare(value: ShareCredentials | null) {
  try {
    if (value) localStorage.setItem(SHARE_STORAGE, JSON.stringify(value)); else localStorage.removeItem(SHARE_STORAGE);
    window.dispatchEvent(new Event(SHARE_EVENT));
    return true;
  } catch { return false; }
}
export function sharePath(value: Pick<ShareCredentials, "id" | "key">) {
  return `/move/day#${new URLSearchParams({ id: value.id, key: value.key })}`;
}
export function shareFromHash(hash: string): ShareCredentials | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const id = params.get("id"), key = params.get("key");
  return isShareId(id) && isShareKey(key) ? { id, key } : null;
}
export async function sharedRequest(body: Record<string, unknown>): Promise<SharedResult> {
  const response = await fetch("/api/move/shared", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), referrerPolicy: "no-referrer", signal: AbortSignal.timeout(15_000) });
  return await response.json() as SharedResult;
}
