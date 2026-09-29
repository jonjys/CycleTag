import { afterEach, describe, expect, it, vi } from "vitest";
import { measurementPayload } from "@/lib/measurement";
import { POST } from "@/app/api/metrics/route";
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
const request = (body: string, origin = "https://cycletag.eu") => new Request("https://cycletag.eu/api/metrics", { method: "POST", headers: { origin }, body });
describe("minimal measurement boundary", () => {
  it.each([null, [], {}, { event: "payment", source: "home" }, { event: "page_view", source: "/tag#private" }, { event: "page_view", source: "home", item: "private" }])("rejects unapproved payload %j", payload => {
    expect(measurementPayload(payload)).toBeNull();
  });
  it("logs only the allowlisted production fields", async () => {
    vi.stubEnv("VERCEL_ENV", "production"); const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await POST(request('{"event":"outbound_ebay","source":"tag"}'))).status).toBe(204);
    expect(log).toHaveBeenCalledExactlyOnceWith('{"kind":"staytag_event","event":"outbound_ebay","source":"tag"}');
  });
  it("does not log preview activity, malformed inputs, PII or cross-origin requests", async () => {
    vi.stubEnv("VERCEL_ENV", "preview"); const log = vi.spyOn(console, "info").mockImplementation(() => {});
    expect((await POST(request('{"event":"page_view","source":"home"}'))).status).toBe(204);
    expect((await POST(request('{"event":"page_view","source":"home","email":"private@example.test"}'))).status).toBe(400);
    expect((await POST(request('broken'))).status).toBe(400);
    expect((await POST(request('{}', "https://elsewhere.test"))).status).toBe(403);
    expect(log).not.toHaveBeenCalled();
  });
  it("accepts the new privacy-safe action names and rejects any added detail", () => {
    for (const event of ["tag_scanned", "replacement_logged", "refill_added", "relay_shared", "space_created", "return_wallet_opened", "return_added", "return_code_opened", "return_dropped_off", "return_refunded", "return_reminder_added"]) {
      expect(measurementPayload({ event, source: "returns" })).toEqual({ event, source: "returns" });
    }
    expect(measurementPayload({ event: "return_added", source: "returns", store: "Zalando" })).toBeNull();
    expect(measurementPayload({ event: "return_added", source: "https://returns.example.com/ABC" })).toBeNull();
  });
  it("keeps every allowed payload under the 128-byte body limit", async () => {
    const { funnelEvents, funnelSources } = await import("@/lib/measurement");
    for (const event of funnelEvents) for (const source of funnelSources) expect(JSON.stringify({ event, source }).length).toBeLessThan(128);
  });
  it("bounds bodies even without content-length", async () => {
    expect((await POST(request("x".repeat(129)))).status).toBe(413);
  });
});
