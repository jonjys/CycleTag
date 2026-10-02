import { afterEach, describe, expect, it, vi } from "vitest";
import { MOVE_PAYMENT_LINK, verifyPassSession } from "@/lib/move-verify";
import { confirmPass, hasPass, needsRecheck, PASS_KEY, readPass, savePass } from "@/lib/move";
import { createVerifyLimiter } from "@/lib/move-verify-limit";
import { memoryShelfStorage } from "@/lib/shelf";
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
    expect(await verifyPassSession(SESSION, KEY, stripe({ ...paid, payment_status: "no_payment_required" }))).toEqual({ status: "unpaid" });
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
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ status: "unavailable" });
  });

  it("only a successful paid response unlocks, including across network failures", async () => {
    const store = memoryShelfStorage();
    vi.stubGlobal("window", { localStorage: store, dispatchEvent: vi.fn() });
    expect(await confirmPass(SESSION, stripe({ status: "unavailable" }, 503))).toBe("unavailable");
    expect(hasPass(store.getItem(PASS_KEY))).toBe(false);
    expect(readPass(store.getItem(PASS_KEY))?.session).toBe(SESSION);
    expect(await confirmPass(SESSION, vi.fn(async () => { throw new Error("offline"); }))).toBe("unavailable");
    expect(hasPass(store.getItem(PASS_KEY))).toBe(false);
    expect(await confirmPass(SESSION, stripe({ status: "paid" }, 500))).toBe("unavailable");
    expect(hasPass(store.getItem(PASS_KEY))).toBe(false);
    expect(await confirmPass(SESSION, stripe({ status: "paid" }))).toBe("paid");
    expect(hasPass(store.getItem(PASS_KEY))).toBe(true);
    const verified = store.getItem(PASS_KEY);
    expect(await confirmPass(SESSION, stripe({ status: "unavailable" }, 503))).toBe("unavailable");
    expect(await confirmPass(SESSION, vi.fn(async () => { throw new Error("offline"); }))).toBe("unavailable");
    expect(store.getItem(PASS_KEY)).toBe(verified);
    expect(await confirmPass(SESSION, stripe({ status: "unpaid" }, 402))).toBe("rejected");
    expect(await confirmPass("forged", stripe({ status: "paid" }))).toBe("rejected");
  });

  it("does not announce activation when the browser cannot save the verified pass", async () => {
    vi.stubGlobal("window", { localStorage: memoryShelfStorage({ throwOnAccess: true }), dispatchEvent: vi.fn() });
    expect(await confirmPass(SESSION, stripe({ status: "paid" }))).toBe("unavailable");
    expect(savePass(SESSION)).toBe(false);
  });

  it("stream-limits oversized bodies without trusting Content-Length", async () => {
    const fetchMock = stripe(paid);
    vi.stubGlobal("fetch", fetchMock);
    const encoder = new TextEncoder();
    const cancel = vi.fn();
    const body = new ReadableStream({
      start(controller) { controller.enqueue(encoder.encode(" ".repeat(513))); },
      cancel
    });
    const request = new Request("https://staytag.nyttolabs.com/api/move/verify", {
      method: "POST", headers: { origin: "https://staytag.nyttolabs.com" }, body,
      duplex: "half"
    } as RequestInit);
    const result = await POST(request);
    expect(result.status).toBe(413);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(cancel).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bounds per-client and total Stripe checks and resets after a minute", () => {
    const allow = createVerifyLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 20; i++) expect(allow("client-one", now)).toBe(true);
    expect(allow("client-one", now)).toBe(false);
    for (let i = 0; i < 180; i++) expect(allow(`client-${i}`, now)).toBe(true);
    expect(allow("another-client", now)).toBe(false);
    expect(allow("client-one", now + 60_000)).toBe(true);
  });

  it("re-checks unverified passes every visit and verified ones weekly", () => {
    const now = new Date("2026-10-10T00:00:00Z");
    expect(needsRecheck(null, now)).toBe(false);
    expect(needsRecheck({}, now)).toBe(true);
    expect(needsRecheck({ verifiedAt: "2026-10-08T00:00:00Z" }, now)).toBe(false);
    expect(needsRecheck({ verifiedAt: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(needsRecheck({ verifiedAt: "broken" }, now)).toBe(true);
    expect(needsRecheck({ verifiedAt: "2026-10-11T00:00:00Z" }, now)).toBe(true);
    expect(hasPass(JSON.stringify({ session: SESSION, at: "2026-10-01T00:00:00Z", verifiedAt: "broken" }))).toBe(false);
    expect(readPass(JSON.stringify({ session: SESSION, at: "2026-10-01T00:00:00Z", verifiedAt: "2026-10-01T00:00:00Z" }))).toEqual({ session: SESSION, verifiedAt: "2026-10-01T00:00:00Z" });
    expect(readPass(JSON.stringify({ session: SESSION, at: "2026-10-01T00:00:00Z" }))).toEqual({ session: SESSION });
    expect(readPass("junk")).toBeNull();
  });
});
