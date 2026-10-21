import { createHash, randomBytes } from "node:crypto";

/** Bounded per-instance protection; creation also has a persistent database limit. */
export function createShareLimiter() {
  const salt = randomBytes(32);
  const buckets = new Map<string, number>();
  let started = 0, total = 0;
  return (client: string, now = Date.now()) => {
    if (now - started >= 60_000 || now < started) { buckets.clear(); total = 0; started = now; }
    if (total >= 3000) return false;
    const key = createHash("sha256").update(salt).update(client).digest("hex");
    const count = buckets.get(key) ?? 0;
    if (count >= 120) return false;
    buckets.set(key, count + 1); total++; return true;
  };
}

export async function readLimitedJson(request: Request, max = 70_000): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > max) throw new Error("too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw new Error("too_large"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(bytes));
}
