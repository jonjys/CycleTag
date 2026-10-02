import { verifyPassSession } from "@/lib/move-verify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ status: "forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 512) return Response.json({ status: "invalid" }, { status: 413 });
  let body: unknown;
  try { body = JSON.parse((await request.text()).slice(0, 512)); } catch { return Response.json({ status: "invalid" }, { status: 400 }); }
  const session = body && typeof body === "object" ? (body as { session?: unknown }).session : undefined;
  const result = await verifyPassSession(session, process.env.STRIPE_SECRET_KEY);
  // "unavailable" is a 200 so a missing key or Stripe hiccup never shows as a browser error; the client keeps the pass.
  const code = result.status === "paid" || result.status === "unavailable" ? 200 : 402;
  return Response.json(result, { status: code, headers: { "Cache-Control": "no-store" } });
}
