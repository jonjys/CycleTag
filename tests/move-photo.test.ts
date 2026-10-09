import { describe, expect, it, vi } from "vitest";
import { cleanItems, readItemsFromPhoto } from "@/lib/move-photo";

const fake = (response: unknown) => ({ beta: { messages: { create: vi.fn(async () => response) } } }) as never;

describe("photo to box contents", () => {
  it("cleans, de-duplicates and caps the list", () => {
    expect(cleanItems([" Kettle ", "kettle", "Mugs\n", 3, "", "x".repeat(60)])).toEqual(["Kettle", "Mugs", "x".repeat(40)]);
    expect(cleanItems(Array.from({ length: 60 }, (_, i) => `item ${i}`))).toHaveLength(40);
    expect(cleanItems("nope")).toEqual([]);
  });
  it("returns items from the structured response", async () => {
    const client = fake({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ items: ["Kettle", "Mugs"] }) }] });
    expect(await readItemsFromPhoto("AAAA", "image/jpeg", "en", client)).toEqual({ status: "ok", items: ["Kettle", "Mugs"] });
  });
  it("handles refusals, failures and a missing key", async () => {
    expect(await readItemsFromPhoto("AAAA", "image/jpeg", "en", fake({ stop_reason: "refusal", content: [] }))).toEqual({ status: "refused" });
    const broken = { beta: { messages: { create: vi.fn(async () => { throw new Error("network"); }) } } } as never;
    expect(await readItemsFromPhoto("AAAA", "image/jpeg", "en", broken)).toEqual({ status: "unavailable" });
    expect(await readItemsFromPhoto("AAAA", "image/jpeg", "en", null)).toEqual({ status: "unavailable" });
  });
});
