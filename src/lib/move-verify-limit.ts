import { createHash, randomBytes } from "node:crypto";

/** Best-effort per-instance protection. No raw IP, session id or QR content is retained.
 * A distributed rate limit belongs at the Vercel Firewall; this needs no database.
 */
export function createVerifyLimiter() {
  const salt = randomBytes(32);
  const buckets = new Map<string, number>();
  let windowStart = 0;
  let total = 0;
  return (client: string, now = Date.now()): boolean => {
    if (now - windowStart >= 60_000 || now < windowStart) {
      buckets.clear(); total = 0; windowStart = now;
    }
    if (total >= 200) return false;
    const key = createHash("sha256").update(salt).update(client).digest("hex");
    const count = buckets.get(key) ?? 0;
    if (count >= 20) return false;
    buckets.set(key, count + 1);
    total++;
    return true;
  };
}
