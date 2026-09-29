import { type CareEvent, type TagPayload, encodeTag, validateTag } from "./tag";

export function careDue(tag: Pick<TagPayload, "s" | "i">): string {
  const date = new Date(`${tag.s}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + tag.i);
  return date.toISOString().slice(0, 10);
}

export function careEvents(tag: TagPayload): CareEvent[] {
  return [...(tag.care?.history ?? []), { n: tag.n, s: tag.s, i: tag.i, part: tag.care?.part, photo: tag.care?.photo }];
}

export function logReplacement(previous: TagPayload, current: TagPayload, options: { roll?: boolean } = {}): TagPayload {
  if (current.s < previous.s) throw new Error("Replacement date cannot be before the previous entry. Use Correct this tag for a correction.");
  if (!options.roll && (previous.care?.history.length ?? 0) >= 5) throw new Error("This sticker holds six care entries. Keep this snapshot and create a new chain for the next replacement.");
  let history = careEvents(previous).slice(-5);
  // Rolling mode keeps the newest entries that fit a reliable QR; the old sticker still holds the full snapshot.
  while (true) {
    const result = validateTag({ ...current, care: { ...current.care, marketplace: current.care?.marketplace ?? false, history } });
    if (!result) throw new Error("Check the care dates and item details.");
    try { encodeTag(result); return result; }
    catch (error) { if (!options.roll || history.length === 0) throw error; history = history.slice(1); }
  }
}

/** Entries that did not fit on the new sticker when logging in rolling mode. */
export function droppedEntries(previous: TagPayload, next: TagPayload): number {
  return Math.max(0, careEvents(previous).length - (next.care?.history.length ?? 0));
}

/** One tap: same item, part and interval, replaced on `day`. */
export function replacedOn(previous: TagPayload, day: string): TagPayload {
  return logReplacement(previous, {
    ...previous,
    s: day,
    care: { ...(previous.care?.part ? { part: previous.care.part } : {}), history: previous.care?.history ?? [], marketplace: previous.care?.marketplace ?? false }
  }, { roll: true });
}

export async function hashPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Choose a photo smaller than 20 MB.");
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
