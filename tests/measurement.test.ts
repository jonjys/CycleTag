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
  it("bounds bodies even without content-length", async () => {
    expect((await POST(request("x".repeat(129)))).status).toBe(413);
  });
});
