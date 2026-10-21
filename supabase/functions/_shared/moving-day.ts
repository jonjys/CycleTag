/** The entire shared manifest: deliberately no contents, packing notes or address. */
export type SharedBoxInput = { n: number; room: string; fragile: boolean; heavy: boolean };
export type BoxState = "packed" | "loaded" | "delivered";
export type SharedBox = SharedBoxInput & { state: BoxState; note: string; revision: number; updatedAt: string; updatedBy: "owner" | "helper" | null };
export type SharedMove = { id: string; title: string; expiresAt: string; createdAt: string; role: "owner" | "helper"; helperKeyId?: string | null; boxes: SharedBox[] };
export type ShareCredentials = { id: string; key: string; helper?: string; expiresAt?: string };
export type SharedResult = { status: string; move?: SharedMove };

export const MAX_SHARED_BOXES = 300;
export const SHARE_DAYS = 30;
export const isShareId = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v);
export const isShareKey = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
export const isBoxState = (v: unknown): v is BoxState => v === "packed" || v === "loaded" || v === "delivered";

export function readManifest(value: unknown): { title: string; boxes: SharedBoxInput[] } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.title !== "string" || v.title.trim().length < 1 || v.title.length > 40 || /[\u0000-\u001f]/.test(v.title)) return null;
  if (!Array.isArray(v.boxes) || !v.boxes.length || v.boxes.length > MAX_SHARED_BOXES) return null;
  const seen = new Set<number>();
  const boxes: SharedBoxInput[] = [];
  for (const raw of v.boxes) {
    if (!raw || typeof raw !== "object") return null;
    const b = raw as Record<string, unknown>;
    if (!Number.isInteger(b.n) || (b.n as number) < 1 || (b.n as number) > 999 || seen.has(b.n as number)) return null;
    if (typeof b.room !== "string" || !b.room.trim() || b.room.length > 30 || /[\u0000-\u001f]/.test(b.room)) return null;
    if (typeof b.fragile !== "boolean" || typeof b.heavy !== "boolean") return null;
    seen.add(b.n as number);
    boxes.push({ n: b.n as number, room: b.room.trim(), fragile: b.fragile, heavy: b.heavy });
  }
  return { title: v.title.trim(), boxes: boxes.sort((a, b) => a.n - b.n) };
}

export function readSharedAction(value: unknown): { action: "create" | "read" | "update" | "rotate" | "delete"; id: string; key: string; data: Record<string, unknown> } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!isShareId(v.id) || !isShareKey(v.key)) return null;
  if (v.action === "read" || v.action === "delete") return { action: v.action, id: v.id, key: v.key, data: {} };
  if (v.action === "create") {
    const manifest = readManifest(v);
    if (!manifest || !isShareKey(v.helper) || v.helper === v.key) return null;
    return { action: v.action, id: v.id, key: v.key, data: { ...manifest, helper: v.helper } };
  }
  if (v.action === "rotate") {
    if (!isShareKey(v.helper) || v.helper === v.key) return null;
    return { action: v.action, id: v.id, key: v.key, data: { helper: v.helper } };
  }
  if (v.action === "update") {
    if (!Number.isInteger(v.n) || (v.n as number) < 1 || (v.n as number) > 999 || !Number.isInteger(v.revision) || (v.revision as number) < 0 || (v.revision as number) > 100_000) return null;
    if (!isBoxState(v.state) || typeof v.note !== "string" || v.note.length > 300 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v.note)) return null;
    return { action: v.action, id: v.id, key: v.key, data: { n: v.n, revision: v.revision, state: v.state, note: v.note.trim() } };
  }
  return null;
}

/** Delivery includes loading; the remaining numbers are useful even on a patchy connection. */
export function sharedProgress(boxes: SharedBox[]) {
  return {
    total: boxes.length,
    loaded: boxes.filter(b => b.state !== "packed").length,
    delivered: boxes.filter(b => b.state === "delivered").length,
    notLoaded: boxes.filter(b => b.state === "packed").map(b => b.n),
    notDelivered: boxes.filter(b => b.state !== "delivered").map(b => b.n),
    exceptions: boxes.filter(b => Boolean(b.note)).length,
  };
}
