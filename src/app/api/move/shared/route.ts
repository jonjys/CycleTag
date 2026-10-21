import { createHash } from "node:crypto";
import { readSharedAction } from "@/lib/shared-move";
import { createShareLimiter, readLimitedJson } from "@/lib/shared-move-server";
import { verifyPassSession } from "@/lib/move-verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
const allow = createShareLimiter();
const reply = (status: string, code: number) => Response.json({ status }, { status: code, headers: { "Cache-Control": "no-store", ...(code === 429 ? { "Retry-After": "60" } : {}) } });

export async function GET() {
  return Response.json({ enabled: Boolean(process.env.STAYTAG_SHARE_API_URL && process.env.STAYTAG_SHARE_SERVICE_KEY) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply("forbidden", 403);
  const client = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  if (!allow(client)) return reply("limited", 429);
  let raw: unknown;
  try { raw = await readLimitedJson(request); }
  catch (error) { return reply("invalid", error instanceof Error && error.message === "too_large" ? 413 : 400); }
  const input = readSharedAction(raw);
  if (!input) return reply("invalid", 400);
  const api = process.env.STAYTAG_SHARE_API_URL, serviceKey = process.env.STAYTAG_SHARE_SERVICE_KEY;
  if (!api || !serviceKey) return reply("unavailable", 503);
  if (input.action === "create" && (input.data.boxes as unknown[]).length > 3) {
    const session = (raw as Record<string, unknown>).session;
    if (typeof session !== "string") return reply("pass_required", 402);
    const verified = await verifyPassSession(session, process.env.STRIPE_SECRET_KEY);
    if (verified.status !== "paid") return reply(verified.status === "unavailable" ? "unavailable" : "pass_required", verified.status === "unavailable" ? 503 : 402);
  }
  try {
    const response = await fetch(api, {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "x-staytag-service": serviceKey },
      body: JSON.stringify({ action: input.action, id: input.id, key: input.key, ...input.data, clientHash: createHash("sha256").update(serviceKey).update(client).digest("hex") }),
      signal: AbortSignal.timeout(12_000),
    });
    const result = await response.json();
    const codes: Record<string, number> = { ok: 200, deleted: 200, invalid: 400, forbidden: 403, not_found: 404, conflict: 409, load_first: 409, limited: 429 };
    if (!result || !(result.status in codes)) return reply("unavailable", 503);
    return Response.json(result, { status: codes[result.status], headers: { "Cache-Control": "no-store", ...(result.status === "limited" ? { "Retry-After": "3600" } : {}) } });
  } catch { return reply("unavailable", 503); }
}
