import { afterEach, describe, expect, it, vi } from "vitest";
import { MOVE_PAYMENT_LINK, verifyPassSession } from "@/lib/move-verify";
import { confirmPass, needsRecheck, readPass } from "@/lib/move";
import { POST } from "@/app/api/move/verify/route";

const SESSION = "cs_live_a1B2c3D4e5F6g7H8i9";
const KEY = "rk_live_test1234567890";
const stripe = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));
const paid = { status: "complete", payment_status: "paid", payment_link: MOVE_PAYMENT_LINK };

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Move Pass server verification", () => {
  it("accepts only a completed, paid session from the Move Pass link", async () => {
    const fetchMock = stripe(paid);
    expect(await verifyPassSession(SESSION, KEY, fetchMock)).toEqual({ status: "paid" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://api.stripe.com/v1/checkout/sessions/${SESSION}`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${KEY}`);
  });

  it("rejects unpaid, open, foreign-link and unknown sessions", async () => {
    expect(await verifyPassSession(SESSION, KEY, stripe({ ...paid, payment_status: "unpaid" }))).toEqual({ status: "unpaid" });
    expect(await verifyPassSession(SESSION, KEY, stripe({ ...paid, status: "open" }))).toEqual({ status: "unpaid" });
    expect(await verifyPassSession(SESSION, KEY, stripe({ ...paid, payment_link: "plink_support" }))).toEqual({ status: "wrong_product" });
    expect(await verifyPassSession(SESSION, KEY, stripe({ error: {} }, 404))).toEqual({ status: "invalid" });
  });

  it("never calls Stripe for malformed ids and reports a missing key as unavailable", async () => {
    const fetchMock = stripe(paid);
    for (const bad of [undefined, 42, "", "cs_live_../../v1/charges", "{CHECKOUT_SESSION_ID}"]) expect(await verifyPassSession(bad, KEY, fetchMock)).toEqual({ status: "invalid" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await verifyPassSession(SESSION, undefined, fetchMock)).toEqual({ status: "unavailable" });
    expect(await verifyPassSession(SESSION, "not-a-key", fetchMock)).toEqual({ status: "unavailable" });
    expect(await verifyPassSession(SESSION, KEY, vi.fn(async () => { throw new Error("network"); }))).toEqual({ status: "unavailable" });
    expect(await verifyPassSession(SESSION, KEY, stripe({}, 500))).toEqual({ status: "unavailable" });
  });

  it("route enforces same origin and body size, maps statuses and never echoes the session", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", KEY);
    vi.stubGlobal("fetch", stripe(paid));
    const req = (body: string, origin = "https://staytag.nyttolabs.com") => new Request("https://staytag.nyttolabs.com/api/move/verify", { method: "POST", headers: { origin, "content-type": "application/json" }, body });
    const ok = await POST(req(JSON.stringify({ session: SESSION })));
    expect(ok.status).toBe(200);
    const text = await ok.text();
    expect(text).toBe('{"status":"paid"}');
    expect(text).not.toContain(SESSION);
    expect((await POST(req(JSON.stringify({ session: SESSION }), "https://evil.test"))).status).toBe(403);
    expect((await POST(req("nope"))).status).toBe(400);
    expect((await POST(req(JSON.stringify({ session: "x" })))).status).toBe(402);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const unavailable = await POST(req(JSON.stringify({ session: SESSION })));
    expect(unavailable.status).toBe(200);
    expect(await unavailable.json()).toEqual({ status: "unavailable" });
  });

  it("client keeps paying customers unlocked when verification is unavailable", async () => {
    expect(await confirmPass(SESSION, stripe({ status: "paid" }))).toBe("paid");
    expect(await confirmPass(SESSION, stripe({ status: "unavailable" }, 503))).toBe("unavailable");
    expect(await confirmPass(SESSION, vi.fn(async () => { throw new Error("offline"); }))).toBe("unavailable");
    expect(await confirmPass(SESSION, stripe({ status: "unpaid" }, 402))).toBe("rejected");
    expect(await confirmPass("forged", stripe({ status: "paid" }))).toBe("rejected");
  });

  it("re-checks unverified passes every visit and verified ones weekly", () => {
    const now = new Date("2026-10-10T00:00:00Z");
    expect(needsRecheck(null, now)).toBe(false);
    expect(needsRecheck({}, now)).toBe(true);
    expect(needsRecheck({ verifiedAt: "2026-10-08T00:00:00Z" }, now)).toBe(false);
    expect(needsRecheck({ verifiedAt: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(readPass(JSON.stringify({ session: SESSION, at: "2026-10-01T00:00:00Z", verifiedAt: "2026-10-01T00:00:00Z" }))).toEqual({ session: SESSION, verifiedAt: "2026-10-01T00:00:00Z" });
    expect(readPass(JSON.stringify({ session: SESSION, at: "2026-10-01T00:00:00Z" }))).toEqual({ session: SESSION });
    expect(readPass("junk")).toBeNull();
  });
});
