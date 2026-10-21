import Stripe from "stripe";
import { MOVE_PAYMENT_LINK } from "./move-verify";
import { siteUrl } from "./site";

/** Stripe holds the durable entitlement; no box contents or new customer database. */
export async function fulfillMovePass(client: Stripe, sessionId: string): Promise<"fulfilled" | "ignored"> {
  const session = await client.checkout.sessions.retrieve(sessionId);
  if (session.payment_link !== MOVE_PAYMENT_LINK || session.status !== "complete" || session.payment_status !== "paid") return "ignored";
  if (session.metadata?.staytag_fulfilled === "v1") return "fulfilled";
  const restoreUrl = `${siteUrl}/move?pass=${session.id}`;
  // Paid invoices are finalized: Stripe rejects footer changes at this point.
  // Metadata stays editable and lets support recover a pass from its receipt.
  // Repeated deliveries do not create invoices or send extra emails.
  const invoiceId = typeof session.invoice === "string" ? session.invoice : session.invoice?.id;
  if (!invoiceId) throw new Error("Move Pass invoice is not ready; retry fulfillment.");
  if (invoiceId) {
    await client.invoices.update(invoiceId, {
      metadata: { staytag_restore_url: restoreUrl, staytag_checkout_session: session.id }
    }, { idempotencyKey: `staytag-move-invoice-v2-${session.id}` });
  }
  await client.checkout.sessions.update(session.id, { metadata: {
    staytag_fulfilled: "v1", staytag_restore_url: restoreUrl
  } }, { idempotencyKey: `staytag-move-entitlement-v1-${session.id}` });
  return "fulfilled";
}
