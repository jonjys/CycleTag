import { PHOTO_MAX_BYTES, PHOTO_TYPES, photoClient, readItemsFromPhoto, type PhotoType } from "@/lib/move-photo";
import { createVerifyLimiter } from "@/lib/move-verify-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
const allow = createVerifyLimiter();
const reply = (body: unknown, code: number, extra: Record<string, string> = {}) => Response.json(body, { status: code, headers: { "Cache-Control": "no-store", ...extra } });

/** Lets the planner show the photo button only when the feature is configured. */
export function GET() { return reply({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) }, 200); }

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return reply({ status: "forbidden" }, 403);
  const limit = PHOTO_MAX_BYTES * 1.4 + 200; // base64 + JSON envelope
  if (Number(request.headers.get("content-length") ?? 0) > limit) return reply({ status: "invalid" }, 413);
  let body: { image?: unknown; type?: unknown; lang?: unknown };
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply({ status: "invalid" }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return reply({ status: "invalid" }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch { return reply({ status: "invalid" }, 400); }
  const { image, type, lang } = body ?? {};
  if (typeof image !== "string" || !/^[A-Za-z0-9+/]+=*$/.test(image) || image.length > PHOTO_MAX_BYTES * 1.37) return reply({ status: "invalid" }, 400);
  if (typeof type !== "string" || !(PHOTO_TYPES as readonly string[]).includes(type)) return reply({ status: "invalid" }, 400);
  const client = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  if (!allow(client)) return reply({ status: "unavailable" }, 429, { "Retry-After": "60" });
  const result = await readItemsFromPhoto(image, type as PhotoType, lang === "sv" ? "sv" : "en", photoClient());
  return reply(result, result.status === "ok" ? 200 : result.status === "unavailable" ? 503 : 422);
}
