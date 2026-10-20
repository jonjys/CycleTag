import { afterEach, describe, expect, it, vi } from "vitest";
import Stripe from "stripe";
import { POST } from "@/app/api/stripe/webhook/route";
import { fulfillMovePass } from "@/lib/move-fulfillment";
import { MOVE_PAYMENT_LINK } from "@/lib/move-verify";
vi.mock("@/lib/move-fulfillment", () => ({ fulfillMovePass: vi.fn(async () => "fulfilled") }));
const secret = "whsec_unit_test_only";
const client = new Stripe("sk_test_unit_test_only");
function request(type = "checkout.session.completed", link = MOVE_PAYMENT_LINK, signingSecret = secret, timestamp?: number) {
  const payload = JSON.stringify({ id: "evt_test", object: "event", type, data: { object: { id: "cs_live_unit123", object: "checkout.session", payment_link: link } } });
  return new Request("https://staytag.nyttolabs.com/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": client.webhooks.generateTestHeaderString({ payload, secret: signingSecret, timestamp }) } });
}
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("Move Pass webhook", () => {
  it("fails closed when not configured", async () => {
    vi.stubEnv("STRIPE_MOVE_WEBHOOK_SECRET", "");
    expect((await POST(request())).status).toBe(503);
  });
  it("rejects forged, missing and stale signatures before accessing Stripe", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_test_only"); vi.stubEnv("STRIPE_MOVE_WEBHOOK_SECRET", secret);
    expect((await POST(request(undefined, undefined, "wrong_secret"))).status).toBe(400);
    expect((await POST(new Request("https://staytag.nyttolabs.com/api/stripe/webhook", { method: "POST", body: "{}" }))).status).toBe(400);
    expect((await POST(request(undefined, undefined, secret, Math.floor(Date.now() / 1000) - 600))).status).toBe(400);
    expect(fulfillMovePass).not.toHaveBeenCalled();
  });
  it.each(["checkout.session.completed", "checkout.session.async_payment_succeeded"])("processes signed %s", async type => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_test_only"); vi.stubEnv("STRIPE_MOVE_WEBHOOK_SECRET", secret);
    expect((await POST(request(type))).status).toBe(200);
    expect(fulfillMovePass).toHaveBeenCalledWith(expect.any(Stripe), "cs_live_unit123");
  });
  it("ignores unrelated products and event types", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_test_only"); vi.stubEnv("STRIPE_MOVE_WEBHOOK_SECRET", secret);
    expect((await POST(request("checkout.session.completed", "plink_other"))).status).toBe(200);
    expect((await POST(request("customer.created"))).status).toBe(200);
    expect(fulfillMovePass).not.toHaveBeenCalled();
  });
  it("returns non-2xx for retry on persistence failure without leaking receipt details", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_test_only"); vi.stubEnv("STRIPE_MOVE_WEBHOOK_SECRET", secret);
    vi.mocked(fulfillMovePass).mockRejectedValueOnce(new Error("private Stripe response"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await POST(request()); expect(r.status).toBe(503); expect(await r.text()).not.toContain("private");
    expect(log).toHaveBeenCalledWith("StayTag Move Pass fulfillment failed; Stripe should retry."); log.mockRestore();
  });
});
