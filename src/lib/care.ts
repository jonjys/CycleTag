import { type CareEvent, type TagPayload, encodeTag, validateTag } from "./tag";

export function careDue(tag: Pick<TagPayload, "s" | "i">): string {
  const date = new Date(`${tag.s}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + tag.i);
  return date.toISOString().slice(0, 10);
}

export function careEvents(tag: TagPayload): CareEvent[] {
  return [...(tag.care?.history ?? []), { n: tag.n, s: tag.s, i: tag.i, part: tag.care?.part, photo: tag.care?.photo }];
}

export function logReplacement(previous: TagPayload, current: TagPayload): TagPayload {
  if (current.s < previous.s) throw new Error("Replacement date cannot be before the previous entry. Use Correct this tag for a correction.");
  if ((previous.care?.history.length ?? 0) >= 5) throw new Error("This sticker holds six care entries. Keep this snapshot and create a new chain for the next replacement.");
  const result = validateTag({ ...current, care: { ...current.care, marketplace: current.care?.marketplace ?? false, history: careEvents(previous) } });
  if (!result) throw new Error("Check the care dates and item details.");
  encodeTag(result);
  return result;
}

export async function hashPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Choose a photo smaller than 20 MB.");
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
