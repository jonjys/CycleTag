import { verifyPassSession } from "@/lib/move-verify";
import { validSessionId } from "@/lib/move";
import { createVerifyLimiter } from "@/lib/move-verify-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;
const allowVerification = createVerifyLimiter();
const reply = (status: string, code: number, extra: Record<string, string> = {}) => Response.json({ status }, { status: code, headers: { "Cache-Control": "no-store", ...extra } });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return reply("forbidden", 403);
  if (Number(request.headers.get("content-length") ?? 0) > 512) return reply("invalid", 413);
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply("invalid", 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 512) { await reader.cancel(); return reply("invalid", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply("invalid", 400); }
  const session = body && typeof body === "object" ? (body as { session?: unknown }).session : undefined;
  if (typeof session !== "string" || !validSessionId(session)) return reply("invalid", 402);
  // Only Vercel's platform-controlled forwarding header is trusted in production.
  const client = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  if (!allowVerification(client)) return reply("unavailable", 429, { "Retry-After": "60" });
  const result = await verifyPassSession(session, process.env.STRIPE_SECRET_KEY);
  const code = result.status === "paid" ? 200 : result.status === "unavailable" ? 503 : 402;
  return reply(result.status, code);
}
