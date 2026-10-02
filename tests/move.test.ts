import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import {
  BOX_MAX_ENCODED, FREE_BOXES, MAX_ITEMS, MOVE_KEY, PASS_KEY, boxLabel, buildBoxUrl, canAddBox, decodeBox, emptyMove, encodeBox, hasPass, moveStats,
  nextBoxNumber, parseItems, parseMove, removeBox, savePass, searchBoxes, upsertBox, validSessionId, validateMove, writeMove, type Box, type Move
} from "@/lib/move";
import { memoryShelfStorage } from "@/lib/shelf";
import { decodePixels } from "@/lib/qr-decode";

const box = (n: number, over: Partial<Box> = {}): Box => ({ n, room: "Kitchen", items: ["Kettle", "Mugs", "Cutlery"], fragile: false, heavy: false, ...over });
const move = (boxes: Box[]): Move => ({ v: 1, name: "Andersson → Uppsala", boxes });

describe("StayTag Move boxes", () => {
  it("parses pasted contents on lines, commas and semicolons, dedupes and caps", () => {
    expect(parseItems("Kettle, mugs\ncutlery; Mugs ,, ")).toEqual(["Kettle", "mugs", "cutlery"]);
    expect(parseItems(Array.from({ length: 60 }, (_, i) => `item ${i}`).join(","))).toHaveLength(MAX_ITEMS);
    expect(parseItems("x".repeat(100))[0]).toHaveLength(60);
  });

  it("numbers boxes, upserts, removes and sorts", () => {
    let m = emptyMove();
    expect(nextBoxNumber(m)).toBe(1);
    m = upsertBox(m, box(2));
    m = upsertBox(m, box(1, { room: "Office" }));
    expect(m.boxes.map(b => b.n)).toEqual([1, 2]);
    expect(nextBoxNumber(m)).toBe(3);
    m = upsertBox(m, { ...box(1), unpacked: true });
    expect(m.boxes[0]).toMatchObject({ room: "Kitchen", unpacked: true });
    expect(removeBox(m, 1).boxes.map(b => b.n)).toEqual([2]);
    expect(() => upsertBox(m, box(0))).toThrow();
  });

  it("allows the first 8 boxes free and unlimited with a pass", () => {
    const seven = move(Array.from({ length: FREE_BOXES - 1 }, (_, i) => box(i + 1)));
    const eight = move(Array.from({ length: FREE_BOXES }, (_, i) => box(i + 1)));
    expect(canAddBox(seven, false)).toBe(true);
    expect(canAddBox(eight, false)).toBe(false);
    expect(canAddBox(eight, true)).toBe(true);
  });

  it("finds which box has the kettle, ignoring case and accents", () => {
    const m = move([box(1), box(2, { room: "Bedroom", items: ["Duvet", "Lampa", "Kaffebryggare"] }), box(3, { room: "Office", items: [], note: "Open first" })]);
    expect(searchBoxes(m, "KETTLE").map(r => r.box.n)).toEqual([1]);
    expect(searchBoxes(m, "kaffe")[0].hits).toEqual(["Kaffebryggare"]);
    expect(searchBoxes(m, "bedroom").map(r => r.box.n)).toEqual([2]);
    expect(searchBoxes(m, "#3").map(r => r.box.n)).toEqual([3]);
    expect(searchBoxes(m, "open first").map(r => r.box.n)).toEqual([3]);
    expect(searchBoxes(m, "")).toHaveLength(3);
    expect(searchBoxes(move([box(1, { items: ["Möbelfötter"] })]), "mobel")).toHaveLength(1);
  });

  it("summarises the move", () => {
    const s = moveStats(move([box(1, { fragile: true }), box(2, { unpacked: true }), box(3, { room: "Office" })]));
    expect(s).toMatchObject({ boxes: 3, unpacked: 1, fragile: 1, items: 9 });
    expect(s.rooms[0]).toEqual({ room: "Kitchen", count: 2 });
  });
});

describe("box QR codec", () => {
  const m = move([box(14, { items: ["Vattenkokare", "Muggar åäö", "茶杯", "Kettle 🫖"], fragile: true, heavy: true, note: "Open first" })]);

  it("round-trips Unicode contents and flags through the URL fragment", () => {
    const url = new URL(buildBoxUrl("https://user:pw@staytag.nyttolabs.com/x?y=1", boxLabel(m, m.boxes[0])));
    expect(url.pathname).toBe("/box");
    expect(url.search).toBe("");
    expect(url.username).toBe("");
    expect(decodeBox(new URLSearchParams(url.hash.slice(1)).get("d"))).toEqual({ move: "Andersson → Uppsala", n: 14, room: "Kitchen", items: ["Vattenkokare", "Muggar åäö", "茶杯", "Kettle 🫖"], fragile: true, heavy: true, note: "Open first" });
  });

  it("never encodes the unpacked mark or anything beyond the box", () => {
    const encoded = encodeBox(boxLabel(m, { ...m.boxes[0], unpacked: true }));
    const json = Buffer.from(encoded, "base64url").toString();
    expect(json).not.toContain("unpacked");
    expect(JSON.parse(json)).toHaveLength(7);
  });

  it("rejects damaged, altered and oversized payloads", () => {
    expect(decodeBox(null)).toBeNull();
    expect(decodeBox("%%%")).toBeNull();
    expect(decodeBox("a".repeat(BOX_MAX_ENCODED + 1))).toBeNull();
    expect(decodeBox(Buffer.from(JSON.stringify([2, "x", 1, "Kitchen", [], 0, ""])).toString("base64url"))).toBeNull();
    expect(decodeBox(Buffer.from(JSON.stringify([1, "x", 1, "Kitchen", [], 9, ""])).toString("base64url"))).toBeNull();
    expect(decodeBox(Buffer.from(JSON.stringify([1, "x", 1, "Kitchen", ["<script>alert(1)</script>"], 0, ""])).toString("base64url"))?.items).toEqual(["<script>alert(1)</script>"]);
    const huge = boxLabel(m, box(1, { items: Array.from({ length: MAX_ITEMS }, (_, i) => `漢字の長い名前のアイテム番号${i}をここに書く`.slice(0, 60)) }));
    expect(() => encodeBox(huge)).toThrow("Too much text");
  });

  it("produces a QR that decodes back to the same box URL at full size", () => {
    const full = boxLabel(m, box(99, { items: Array.from({ length: 25 }, (_, i) => `Item number ${i} with a name`) }));
    const url = buildBoxUrl("https://staytag.nyttolabs.com", full);
    const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
    const scale = 4, margin = 4, size = qr.modules.size, width = (size + margin * 2) * scale;
    const data = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < width; y++) for (let x = 0; x < width; x++) {
      const mx = Math.floor(x / scale) - margin, my = Math.floor(y / scale) - margin;
      if (mx >= 0 && my >= 0 && mx < size && my < size && qr.modules.get(my, mx)) { const i = (y * width + x) * 4; data[i] = data[i + 1] = data[i + 2] = 0; }
    }
    expect(decodePixels(data, width, width)?.text).toBe(url);
  });
});

describe("Move storage and pass", () => {
  it("persists the move and survives corrupted storage", () => {
    const store = memoryShelfStorage();
    expect(writeMove(move([box(1)]), store)).toBe(true);
    expect(parseMove(store.getItem(MOVE_KEY)).move.boxes).toHaveLength(1);
    expect(parseMove("{broken")).toEqual({ move: emptyMove(), damaged: true });
    expect(parseMove(null).damaged).toBe(false);
    expect(validateMove({ v: 1, name: "x", boxes: [box(1), box(1)] })).toBeNull();
    expect(writeMove(move([box(1)]), memoryShelfStorage({ throwOnAccess: true }))).toBe(false);
  });

  it("accepts only Stripe checkout session ids as a pass", () => {
    expect(validSessionId("cs_live_a1B2c3D4e5F6g7H8")).toBe(true);
    expect(validSessionId("cs_test_a1B2c3D4e5F6g7H8")).toBe(true);
    for (const bad of [null, "", "{CHECKOUT_SESSION_ID}", "cs_live_", "pi_123456789012", "cs_live_<script>", "javascript:alert(1)"]) expect(validSessionId(bad)).toBe(false);
    const store = memoryShelfStorage();
    expect(savePass("not-a-session", store)).toBe(false);
    expect(hasPass(store.getItem(PASS_KEY))).toBe(false);
    expect(savePass("cs_live_a1B2c3D4e5F6g7H8", store)).toBe(true);
    expect(hasPass(store.getItem(PASS_KEY))).toBe(false);
    expect(savePass("cs_live_a1B2c3D4e5F6g7H8", store, new Date(), true)).toBe(true);
    expect(hasPass(store.getItem(PASS_KEY))).toBe(true);
    expect(hasPass("{bad")).toBe(false);
  });
});
