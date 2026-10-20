import Stripe from "stripe";
import { MOVE_PAYMENT_LINK } from "@/lib/move-verify";
import { fulfillMovePass } from "@/lib/move-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const reply = (status: string, code: number) => Response.json({ status }, { status: code, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_MOVE_WEBHOOK_SECRET;
  if (!key || !secret) return reply("unavailable", 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return reply("invalid", 400);
  // Read raw bytes with an actual stream limit, regardless of Content-Length.
  const reader = request.body?.getReader();
  if (!reader) return reply("invalid", 400);
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 131072) { await reader.cancel(); return reply("invalid", 413); }
      chunks.push(value);
    }
  } catch { return reply("invalid", 400); }
  const client = new Stripe(key, { maxNetworkRetries: 1, timeout: 8000 });
  let event: Stripe.Event;
  try { event = client.webhooks.constructEvent(Buffer.concat(chunks), signature, secret); }
  catch { return reply("invalid", 400); }
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") return reply("ignored", 200);
  // Other Nytto Labs products use this Stripe account too.
  const session = event.data.object;
  if (session.payment_link !== MOVE_PAYMENT_LINK) return reply("ignored", 200);
  try { return reply(await fulfillMovePass(client, session.id), 200); }
  catch {
    // No payload, customer, session, photo or secret is logged. Non-2xx makes Stripe retry.
    console.error("StayTag Move Pass fulfillment failed; Stripe should retry.");
    return reply("unavailable", 503);
  }
}
