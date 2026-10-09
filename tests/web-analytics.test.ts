import { describe, expect, it } from "vitest";
import { beforeSend } from "@/app/web-analytics";

describe("web analytics privacy filter", () => {
  it("drops query strings and fragments", () => {
    expect(beforeSend({ type: "pageview", url: "https://staytag.nyttolabs.com/move?pass=cs_live_abc#d=secret" }, {})).toEqual({ type: "pageview", url: "https://staytag.nyttolabs.com/move" });
  });
  it("sends nothing under Do Not Track or Global Privacy Control", () => {
    const event = { type: "pageview" as const, url: "https://staytag.nyttolabs.com/" };
    expect(beforeSend(event, { doNotTrack: "1" })).toBeNull();
    expect(beforeSend(event, { globalPrivacyControl: true })).toBeNull();
  });
});
