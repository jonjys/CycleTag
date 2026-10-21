import { afterEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { fulfillMovePass } from "@/lib/move-fulfillment";
import { MOVE_PAYMENT_LINK } from "@/lib/move-verify";

const paid = { id: "cs_live_fulfillment123", payment_link: MOVE_PAYMENT_LINK, status: "complete", payment_status: "paid", invoice: "in_receipt", metadata: {} };
function fake(session: unknown = paid) {
  const updateInvoice = vi.fn(async () => ({}));
  const updateSession = vi.fn(async () => ({}));
  const client = { checkout: { sessions: { retrieve: vi.fn(async () => session), update: updateSession } }, invoices: { update: updateInvoice } };
  return { client: client as unknown as Stripe, updateInvoice, updateSession };
}
afterEach(() => vi.restoreAllMocks());
describe("durable Move Pass fulfillment", () => {
  it("keeps finalized receipt fields immutable and records recovery metadata in Stripe", async () => {
    const f = fake();
    expect(await fulfillMovePass(f.client, paid.id)).toBe("fulfilled");
    expect(f.updateInvoice).toHaveBeenCalledWith("in_receipt", { metadata: { staytag_restore_url: expect.stringContaining(`/move?pass=${paid.id}`), staytag_checkout_session: paid.id } }, { idempotencyKey: `staytag-move-invoice-v2-${paid.id}` });
    expect(f.updateSession).toHaveBeenCalledWith(paid.id, { metadata: { staytag_fulfilled: "v1", staytag_restore_url: expect.stringContaining(paid.id) } }, { idempotencyKey: `staytag-move-entitlement-v1-${paid.id}` });
  });
  it.each([
    { ...paid, payment_status: "unpaid" }, { ...paid, payment_status: "no_payment_required" },
    { ...paid, status: "open" }, { ...paid, payment_link: "plink_other_product" }
  ])("never grants an unpaid or different product session", async session => {
    const f = fake(session);
    expect(await fulfillMovePass(f.client, paid.id)).toBe("ignored");
    expect(f.updateInvoice).not.toHaveBeenCalled(); expect(f.updateSession).not.toHaveBeenCalled();
  });
  it("does not fulfill twice and uses stable idempotency keys for concurrent deliveries", async () => {
    const f = fake({ ...paid, metadata: { staytag_fulfilled: "v1" } });
    expect(await fulfillMovePass(f.client, paid.id)).toBe("fulfilled");
    expect(f.updateInvoice).not.toHaveBeenCalled(); expect(f.updateSession).not.toHaveBeenCalled();
    const concurrent = fake();
    await Promise.all([fulfillMovePass(concurrent.client, paid.id), fulfillMovePass(concurrent.client, paid.id)]);
    expect(concurrent.updateInvoice.mock.calls[0]).toEqual(concurrent.updateInvoice.mock.calls[1]);
    expect(concurrent.updateSession.mock.calls[0]).toEqual(concurrent.updateSession.mock.calls[1]);
  });
  it("leaves fulfillment unmarked when receipt persistence fails, allowing Stripe to retry", async () => {
    const f = fake(); f.updateInvoice.mockRejectedValueOnce(new Error("retry"));
    await expect(fulfillMovePass(f.client, paid.id)).rejects.toThrow("retry");
    expect(f.updateSession).not.toHaveBeenCalled();
  });
});
