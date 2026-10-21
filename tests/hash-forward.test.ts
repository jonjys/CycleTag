import { describe, expect, it } from "vitest";
import { forwardTarget } from "@/app/hash-forward";

describe("old home-page hash links", () => {
  it("forward the label builder to /labels", () => {
    expect(forwardTarget("#edit=abc")).toBe("/labels#edit=abc");
    expect(forwardTarget("#print=abc")).toBe("/labels#print=abc");
    expect(forwardTarget("#log=abc")).toBe("/labels#log=abc");
    expect(forwardTarget("#clone=abc")).toBe("/labels#clone=abc");
    expect(forwardTarget("#create")).toBe("/labels#create");
    expect(forwardTarget("#tags")).toBe("/labels#tags");
  });
  it("keeps landing anchors and forwards the old start link to the packing app", () => {
    for (const hash of ["", "#how"]) expect(forwardTarget(hash)).toBeNull();
    expect(forwardTarget("#start")).toBe("/move#start");
  });
});
