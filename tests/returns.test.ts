import { describe, expect, it } from "vitest";
import {
  RETURNS_KEY, RETURNS_LIMIT, RETURN_CODE_MAX, addDays, buildBackup, codeLinkHost, createReturn, createReturnIcs, findDuplicate, mergeBackup,
  nextStatus, parseAmount, parseReturns, pendingTotals, previousStatus, readReturns, returnCountdown, safeCodeLink, sortReturns, transition,
  updateReturn, validateReturn, writeReturns, type ReturnItem
} from "@/lib/returns";
import { memoryShelfStorage } from "@/lib/shelf";

const now = new Date("2026-09-29T10:00:00.000Z");
const base = (over: Partial<ReturnItem> = {}): ReturnItem => createReturn({ store: "Zalando", product: "Nike Air Max", deadline: "2026-10-14", amount: 699, currency: "SEK", code: "https://returns.example.com/r/ABC123", codeKind: "qr", hasImage: false, ...over }, now, over.id ?? "aaaaaaaa11112222");

describe("Return Wallet validation", () => {
  it("creates a minimal return with only a store", () => {
    const item = createReturn({ store: " Zalando ", codeKind: "none", hasImage: false }, now, "abcdef0123456789");
    expect(item).toMatchObject({ v: 1, store: "Zalando", status: "ready", codeKind: "none", createdAt: now.toISOString() });
    expect(item.code).toBeUndefined();
  });

  it("rejects missing store, bad dates, bad amounts and bad ids", () => {
    expect(() => createReturn({ store: "  ", codeKind: "none", hasImage: false })).toThrow();
    expect(() => base({ deadline: "2026-02-30" })).toThrow();
    expect(() => base({ amount: -1 })).toThrow();
    expect(() => base({ amount: Number.NaN })).toThrow();
    expect(() => createReturn({ store: "X", amount: 10, codeKind: "none", hasImage: false } as never)).toThrow(); // amount needs a currency
    expect(validateReturn({ ...base(), id: "../../etc" })).toBeNull();
    expect(validateReturn({ ...base(), status: "shipped" })).toBeNull();
    expect(validateReturn({ ...base(), codeKind: "qr", code: undefined })).toBeNull();
    expect(validateReturn({ ...base(), createdAt: "yesterday" })).toBeNull();
  });

  it("keeps the code byte-for-byte, including Unicode, and caps its size", () => {
    const code = "  Retur åäö 退货 🚚\nline 2  ";
    expect(base({ code }).code).toBe(code);
    expect(base({ code: "x".repeat(RETURN_CODE_MAX) }).code).toHaveLength(RETURN_CODE_MAX);
    expect(() => base({ code: "x".repeat(RETURN_CODE_MAX + 1) })).toThrow();
    expect(() => base({ code: "a\u0000b" })).toThrow();
  });

  it("cleans display text and never stores HTML as markup", () => {
    const item = base({ store: "<img src=x onerror=alert(1)>", note: "line\none\t tab" });
    expect(item.store).toBe("<img src=x onerror=alert(1)>");
    expect(item.note).toBe("line one tab");
  });

  it("updates details without touching id, status or dates", () => {
    const item = transition(base(), "dropped", "2026-10-01");
    const next = updateReturn(item, { store: "H&M", codeKind: "none", hasImage: false });
    expect(next).toMatchObject({ id: item.id, status: "dropped", droppedAt: "2026-10-01", store: "H&M", codeKind: "none" });
    expect(next.code).toBeUndefined();
  });
});

describe("Return Wallet lifecycle", () => {
  it("moves ready → dropped → pending → refunded and back", () => {
    expect(nextStatus("ready")).toBe("dropped");
    expect(nextStatus("dropped")).toBe("pending");
    expect(nextStatus("pending")).toBe("refunded");
    expect(nextStatus("refunded")).toBeNull();
    expect(nextStatus("kept")).toBeNull();
    expect(previousStatus("refunded")).toBe("pending");
    expect(previousStatus("kept")).toBe("ready");
    expect(previousStatus("ready")).toBeNull();
  });

  it("stamps and clears drop-off and refund dates", () => {
    const dropped = transition(base(), "dropped", "2026-10-02");
    expect(dropped.droppedAt).toBe("2026-10-02");
    const refunded = transition(transition(dropped, "pending", "2026-10-05"), "refunded", "2026-10-09");
    expect(refunded).toMatchObject({ droppedAt: "2026-10-02", refundedAt: "2026-10-09" });
    const undone = transition(refunded, "ready", "2026-10-10");
    expect(undone.droppedAt).toBeUndefined();
    expect(undone.refundedAt).toBeUndefined();
    expect(transition(base(), "refunded", "2026-10-03").droppedAt).toBe("2026-10-03");
    expect(() => transition(base(), "lost" as never, "2026-10-03")).toThrow();
  });

  it("counts down calmly and escalates near the deadline", () => {
    expect(returnCountdown("2026-10-14", "2026-09-29")).toEqual({ days: 15, tone: "calm" });
    expect(returnCountdown("2026-10-14", "2026-10-08")).toEqual({ days: 6, tone: "soon" });
    expect(returnCountdown("2026-10-14", "2026-10-12")).toEqual({ days: 2, tone: "urgent" });
    expect(returnCountdown("2026-10-14", "2026-10-14")).toEqual({ days: 0, tone: "today" });
    expect(returnCountdown("2026-10-14", "2026-10-16")).toEqual({ days: -2, tone: "overdue" });
    expect(returnCountdown(undefined, "2026-10-16")).toBeNull();
    expect(returnCountdown("2027-02-29", "2026-10-16")).toBeNull();
    expect(returnCountdown("2024-03-01", "2024-02-28")?.days).toBe(2); // leap day
  });

  it("sorts ready returns by deadline first, then undated, then in transit", () => {
    const a = base({ id: "aaaaaaaa00000001", deadline: "2026-10-20" });
    const b = base({ id: "aaaaaaaa00000002", deadline: "2026-10-05" });
    const c = base({ id: "aaaaaaaa00000003", deadline: undefined });
    const d = transition(base({ id: "aaaaaaaa00000004", deadline: "2026-10-01" }), "dropped", "2026-09-30");
    expect(sortReturns([a, d, c, b]).map(item => item.id)).toEqual([b.id, a.id, c.id, d.id]);
  });

  it("totals money still owed per currency, excluding refunded and kept", () => {
    const items = [base({ id: "aaaaaaaa00000001", amount: 699 }), base({ id: "aaaaaaaa00000002", amount: 100.5 }), base({ id: "aaaaaaaa00000003", amount: 20, currency: "EUR" }),
      transition(base({ id: "aaaaaaaa00000004", amount: 1000 }), "refunded", "2026-10-01"), transition(base({ id: "aaaaaaaa00000005", amount: 50 }), "kept", "2026-10-01")];
    expect(pendingTotals(items)).toEqual([{ currency: "SEK", amount: 799.5 }, { currency: "EUR", amount: 20 }]);
  });

  it("parses everyday amount formats", () => {
    expect(parseAmount("699")).toBe(699);
    expect(parseAmount("699,50")).toBe(699.5);
    expect(parseAmount("1 299.00 kr")).toBe(1299);
    expect(parseAmount("1.299,95")).toBe(1299.95);
    expect(parseAmount("1,299")).toBe(1299);
    expect(parseAmount("")).toBeUndefined();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("-5")).toBeNull();
    expect(parseAmount("1e9")).toBeNull();
  });

  it("detects the same active code as a duplicate, ignoring finished returns", () => {
    const item = base();
    expect(findDuplicate([item], `${item.code} `)?.id).toBe(item.id);
    expect(findDuplicate([item], item.code, item.id)).toBeUndefined();
    expect(findDuplicate([transition(item, "refunded", "2026-10-01")], item.code)).toBeUndefined();
    expect(findDuplicate([item], undefined)).toBeUndefined();
  });
});

describe("Return Wallet storage", () => {
  it("persists and reads back through local storage", () => {
    const store = memoryShelfStorage();
    expect(writeReturns([base()], store)).toEqual({ ok: true });
    expect(readReturns(store).items).toEqual([base()]);
  });

  it("reports corrupted storage instead of silently overwriting it", () => {
    const store = memoryShelfStorage({ initial: { [RETURNS_KEY]: "{not json" } });
    expect(readReturns(store)).toEqual({ items: [], damaged: true, skipped: 0 });
    expect(writeReturns([base()], store)).toEqual({ ok: false, reason: "damaged" });
    expect(store.getItem(RETURNS_KEY)).toBe("{not json");
    expect(writeReturns([], store, { overwriteDamaged: true })).toEqual({ ok: true });
    expect(readReturns(store).damaged).toBe(false);
  });

  it("keeps valid entries when one entry is damaged or duplicated", () => {
    const good = base();
    const raw = JSON.stringify({ v: 1, items: [good, { ...good, id: "bbbbbbbb00000000", deadline: "nope" }, good, "junk"] });
    expect(parseReturns(raw)).toEqual({ items: [good], damaged: false, skipped: 3 });
    expect(parseReturns(JSON.stringify({ v: 2, items: [] })).damaged).toBe(true);
    expect(parseReturns("null").damaged).toBe(true);
  });

  it("handles blocked storage, quota errors and the item limit", () => {
    expect(writeReturns([base()], memoryShelfStorage({ throwOnAccess: true }))).toEqual({ ok: false, reason: "unavailable" });
    expect(writeReturns([base()], memoryShelfStorage({ quotaBytes: 10 }))).toEqual({ ok: false, reason: "quota" });
    const many = Array.from({ length: RETURNS_LIMIT + 1 }, (_, i) => base({ id: `cccccccc${String(i).padStart(8, "0")}` }));
    expect(writeReturns(many, memoryShelfStorage())).toEqual({ ok: false, reason: "full" });
    expect(readReturns(memoryShelfStorage({ throwOnAccess: true })).items).toEqual([]);
  });

  it("merges a backup without overwriting existing returns and drops unsafe images", () => {
    const mine = base();
    const theirs = base({ id: "dddddddd00000001", store: "Amazon", hasImage: true });
    const bad = base({ id: "dddddddd00000002", store: "Evil", hasImage: true });
    const text = buildBackup([mine, theirs, bad], { [theirs.id]: "data:image/png;base64,iVBORw0KGgo=", [bad.id]: "data:text/html;base64,PHNjcmlwdD4=" });
    const merged = mergeBackup([mine], text);
    expect(merged.added).toBe(2);
    expect(merged.skipped).toBe(1);
    expect(Object.keys(merged.images)).toEqual([theirs.id]);
    expect(merged.items.find(item => item.id === bad.id)?.hasImage).toBe(false);
    expect(() => mergeBackup([], "{}")).toThrow("not a StayTag");
    expect(() => mergeBackup([], "garbage")).toThrow("not a StayTag");
  });
});

describe("Return code safety", () => {
  it("offers only explicit https links and never scripts, data or local targets", () => {
    expect(safeCodeLink("https://www.zalando.se/returns?id=1")).toBe("https://www.zalando.se/returns?id=1");
    expect(codeLinkHost("https://www.zalando.se/returns?id=1")).toBe("zalando.se");
    for (const unsafe of ["javascript:alert(1)", "data:text/html,<script>", "http://example.com", "https://user:pw@example.com", "https://localhost/x", "https://192.168.0.1/", "https://[::1]/", "intent://x", "file:///etc/passwd", "https://exa mple.com", "ABC123", "https://evil.test/x"]) {
      expect(safeCodeLink(unsafe)).toBeNull();
    }
  });
});

describe("Return reminder calendar file", () => {
  it("adds one all-day event with alarms and without the return code", () => {
    const item = base();
    const ics = createReturnIcs(item, [7, 3, 1, 0], "https://cycletag.eu/returns", now);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261014");
    expect(ics).toContain("DTEND;VALUE=DATE:20261015");
    expect(ics).toContain("TRIGGER:-P6DT15H");
    expect(ics).toContain("TRIGGER:-P2DT15H");
    expect(ics).toContain("TRIGGER:-PT15H");
    expect(ics).toContain("TRIGGER:PT9H");
    expect(ics).toContain(`UID:staytag-return-${item.id}@cycletag.eu`);
    expect(ics).not.toContain("ABC123");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(4);
    expect(() => createReturnIcs(base({ deadline: undefined }), [1], "https://cycletag.eu/returns")).toThrow();
  });

  it("escapes calendar control characters in store names", () => {
    const ics = createReturnIcs(base({ store: "A;B,C\\D" }), [1], "https://cycletag.eu/returns", now);
    expect(ics).toContain("A\\;B\\,C\\\\D");
  });

  it("adds days across month and leap boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
