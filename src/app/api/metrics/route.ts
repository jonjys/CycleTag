import { measurementPayload } from "@/lib/measurement";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 128) return new Response(null, { status: 413 });
  try {
    // Stream-limit input rather than loading arbitrary request bodies or logging them.
    const reader = request.body?.getReader(); if (!reader) return new Response(null, { status: 400 });
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 128) { await reader.cancel(); return new Response(null, { status: 413 }); } chunks.push(value); }
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const payload = measurementPayload(JSON.parse(new TextDecoder().decode(bytes)));
    if (!payload) return new Response(null, { status: 400 });
    if (process.env.VERCEL_ENV === "production") console.info(JSON.stringify({ kind: "staytag_event", ...payload }));
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch { return new Response(null, { status: 400 }); }
}
