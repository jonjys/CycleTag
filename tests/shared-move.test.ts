import { afterEach, describe, expect, it, vi } from "vitest";
import { isShareKey, newShareKey, parseShare, readManifest, readSharedAction, shareFromHash, sharePath, sharedProgress, type SharedBox } from "@/lib/shared-move";
import { createShareLimiter, readLimitedJson } from "@/lib/shared-move-server";
import { POST } from "@/app/api/move/shared/route";

vi.mock("@/lib/move-verify", () => ({ verifyPassSession: vi.fn(async () => ({ status: "unpaid" })) }));
import { verifyPassSession } from "@/lib/move-verify";

const id = "842b65ab-10bb-4c89-8f69-80e8b6752962";
const key = "a".repeat(43), helper = "b".repeat(43);
const box = { n: 1, room: "Kitchen", fragile: true, heavy: false };
const create = { action: "create", id, key, helper, title: "Moving day", boxes: [box] };
const request = (body: unknown, origin = "https://staytag.example") => new Request("https://staytag.example/api/move/shared", { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("shared move privacy and capabilities", () => {
  it("only uploads the promised manifest fields, never contents, packing notes or owner details", () => {
    const manifest = readManifest({ title: "Moving day", name: "Private owner", address: "Private address", boxes: [{ ...box, items: ["Passport"], note: "Key is under mat", unpacked: true }] });
    expect(manifest).toEqual({ title: "Moving day", boxes: [box] });
    expect(readSharedAction({ ...create, session: "private-pass", ownerHash: "fake", clientHash: "fake" })?.data).toEqual({ title: "Moving day", boxes: [box], helper });
  });
  it("rejects duplicates, empty manifests and oversized or invalid fields", () => {
    for (const boxes of [[], [box, box], Array.from({ length: 301 }, (_, i) => ({ ...box, n: i + 1 })), [{ ...box, room: "x".repeat(31) }], [{ ...box, n: 0 }]]) expect(readManifest({ title: "Move", boxes })).toBeNull();
    expect(readSharedAction({ ...create, key: "short" })).toBeNull();
    expect(readSharedAction({ ...create, helper: key })).toBeNull();
    expect(readSharedAction({ action: "update", id, key, n: 1, state: "delivered", revision: 1, note: "x".repeat(301) })).toBeNull();
  });
  it("makes 256-bit keys and keeps them in the URL fragment", () => {
    const generated = newShareKey();
    expect(isShareKey(generated)).toBe(true);
    expect(generated).not.toBe(newShareKey());
    const path = sharePath({ id, key });
    const url = new URL(path, "https://staytag.example");
    expect(url.pathname).toBe("/move/day"); expect(url.search).toBe("");
    expect(shareFromHash(url.hash)).toEqual({ id, key });
    expect(shareFromHash(`#id=${id}`)).toBeNull();
    expect(parseShare("not json")).toBeNull();
  });
  it("counts delivered boxes as loaded and identifies the missing numbers", () => {
    const boxes = ["packed", "loaded", "delivered"].map((state, i) => ({ ...box, n: i + 1, state, note: i === 1 ? "Check corner" : "", revision: i, updatedAt: "2026-10-21T12:00:00Z", updatedBy: null })) as SharedBox[];
    expect(sharedProgress(boxes)).toEqual({ total: 3, loaded: 2, delivered: 1, notLoaded: [1], notDelivered: [1, 2], exceptions: 1 });
  });
});

describe("shared move API boundaries", () => {
  function configure() {
    vi.stubEnv("STAYTAG_SHARE_API_URL", "https://backend.example/function"); vi.stubEnv("STAYTAG_SHARE_SERVICE_KEY", "c".repeat(43));
  }
  it("rejects cross-origin and malformed requests without contacting the backend", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await POST(request(create, "https://evil.example"))).status).toBe(403);
    expect((await POST(request({ ...create, id: "not-an-id" }))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("limits streamed bodies even without a Content-Length header", async () => {
    const r = new Request("https://staytag.example", { method: "POST", body: JSON.stringify({ note: "x".repeat(70_001) }) });
    await expect(readLimitedJson(r)).rejects.toThrow("too_large");
  });
  it("uses its own service key and client hash, stripping private inventory and forged backend fields", async () => {
    configure();
    const fetch = vi.fn(async () => Response.json({ status: "ok", move: { id } })); vi.stubGlobal("fetch", fetch);
    const result = await POST(request({ ...create, session: "private-pass", clientHash: "forged", environment: "production", boxes: [{ ...box, items: ["Private papers"] }] }));
    expect(result.status).toBe(200);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    const forwarded = JSON.parse(init.body as string);
    expect(forwarded.boxes).toEqual([box]); expect(forwarded.clientHash).toMatch(/^[a-f0-9]{64}$/);
    expect(forwarded).not.toHaveProperty("environment"); expect(forwarded).not.toHaveProperty("session");
    expect(init.headers).toHaveProperty("x-staytag-service", "c".repeat(43));
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it("requires a verified paid Move Pass for more than three shared boxes", async () => {
    configure(); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const four = { ...create, boxes: Array.from({ length: 4 }, (_, i) => ({ ...box, n: i + 1 })) };
    expect((await POST(request(four))).status).toBe(402);
    expect((await POST(request({ ...four, session: "fake" }))).status).toBe(402);
    expect(verifyPassSession).toHaveBeenCalledWith("fake", undefined);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("fails closed on a backend outage and preserves conflict status for safe retries", async () => {
    configure(); vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    expect((await POST(request({ action: "read", id, key }))).status).toBe(503);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ status: "conflict" }, { status: 409 })));
    expect((await POST(request({ action: "update", id, key, n: 1, revision: 0, state: "loaded", note: "" }))).status).toBe(409);
  });
  it("bounds request rates and resets the minute window", () => {
    const allow = createShareLimiter(); for (let i = 0; i < 120; i++) expect(allow("same", 1000)).toBe(true);
    expect(allow("same", 1000)).toBe(false); expect(allow("other", 1000)).toBe(true); expect(allow("same", 61_000)).toBe(true);
  });
});
