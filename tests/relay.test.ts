import { describe, expect, it } from "vitest";
import { addRelayItem, buildRelayUrl, decodeRelay, encodeRelay, parseRelay, RELAY_KEY, validateRelay, writeRelay, type RelayList } from "../src/lib/relay";
import { memoryShelfStorage } from "../src/lib/shelf";
const item = { n: "Kök 水 filter", q: "Filter F-200", m: "DE" as const, quantity: 2 };
const list: RelayList = { v: 1, items: [item] };
describe("Refill Relay", () => {
  it("round-trips international names, exact searches and quantities", () => expect(decodeRelay(encodeRelay(list))).toEqual(list));
  it("keeps shared data in the fragment and removes origin credentials", () => { const url = new URL(buildRelayUrl("https://user:pass@cycletag.eu/old?a=1", list)); expect(url.pathname).toBe("/relay"); expect(url.search).toBe(""); expect(url.username).toBe(""); expect(decodeRelay(url.hash.slice(6))).toEqual(list); });
  it.each([0, -1, 100, 1.5, "2", null])("rejects invalid quantity %s", quantity => expect(validateRelay({ ...list, items: [{ ...item, quantity }] })).toBeNull());
  it("deduplicates repeated scans without inflating quantity", () => { const store = memoryShelfStorage(); expect(addRelayItem(item, store)).toBe("added"); expect(addRelayItem({ ...item, q: "filter   f-200" }, store)).toBe("exists"); expect(parseRelay(store.getItem(RELAY_KEY))?.items).toEqual([item]); });
  it("keeps different marketplaces separate", () => { const store = memoryShelfStorage(); addRelayItem(item, store); addRelayItem({ ...item, m: "US" }, store); expect(parseRelay(store.getItem(RELAY_KEY))?.items).toHaveLength(2); });
  it("rejects corrupt data without overwriting it", () => { const store = memoryShelfStorage({ initial: { [RELAY_KEY]: "corrupt" } }); expect(() => addRelayItem(item, store)).toThrow(/could not be read/); expect(store.getItem(RELAY_KEY)).toBe("corrupt"); });
  it("reports blocked or full storage", () => { expect(() => addRelayItem(item, memoryShelfStorage({ throwOnAccess: true }))).toThrow(/blocked/); expect(() => writeRelay(list, memoryShelfStorage({ quotaBytes: 1 }))).toThrow(/Could not save/); });
  it("bounds lists and share links", () => { expect(validateRelay({ v: 1, items: Array(25).fill(item) })).toBeNull(); expect(decodeRelay("a".repeat(8001))).toBeNull(); expect(() => encodeRelay({ v: 1, items: [] })).toThrow(); });
  it.each(["bad!", "_w", "", Buffer.from('[1,[["x"]]]').toString("base64url")])("rejects malformed data %s", value => expect(decodeRelay(value)).toBeNull());
});
