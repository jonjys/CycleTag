import { describe, expect, it } from "vitest";
import { contact, contactLinks } from "../src/lib/contact";

describe("public contact configuration", () => {
  it("uses official Nytto Labs inboxes, not a product-unique or Gmail address", () => {
    expect(contact).toMatchObject({
      productName: "CycleTag",
      operatorName: "Nytto Labs",
      operatorWebsite: "https://nyttolabs.com",
      country: "Sweden",
      email: {
        general: "hello@nyttolabs.com",
        support: "support@nyttolabs.com",
        privacy: "privacy@nyttolabs.com",
        billing: "billing@nyttolabs.com"
      }
    });
    for (const address of Object.values(contact.email)) {
      expect(address.endsWith("@nyttolabs.com")).toBe(true);
    }
  });

  it("provides mailto links for every public email address", () => {
    expect(contactLinks.general).toBe(`mailto:${contact.email.general}`);
    expect(contactLinks.support).toBe(`mailto:${contact.email.support}`);
    expect(contactLinks.privacy).toBe(`mailto:${contact.email.privacy}`);
    expect(contactLinks.billing).toBe(`mailto:${contact.email.billing}`);
  });
});
