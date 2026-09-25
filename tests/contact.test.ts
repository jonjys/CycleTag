import { describe, expect, it } from "vitest";
import {
  contact,
  contactLinks,
  operatorAttribution,
  operatorTaxDisclosure
} from "../src/lib/contact";

describe("public contact configuration", () => {
  it("uses official Nytto Labs inboxes, not a product-unique or Gmail address", () => {
    expect(contact).toMatchObject({
      productName: "StayTag",
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
      expect(address.startsWith("fkornelind@")).toBe(false);
    }
  });

  it("names the Swedish operator without a personal name or unpublished numbers", () => {
    expect(contact).not.toHaveProperty("operatorPerson");
    expect(contact.legalForm).toBe("Swedish sole trader");
    expect(contact.fTaxStatus).toBe("Approved for F-tax");
    expect(contact.vatStatus).toBe("Registered for VAT");
    expect(operatorAttribution).toBe("Nytto Labs");
    expect(operatorTaxDisclosure).toBe("Approved for F-tax. Registered for VAT.");

    const publicIdentity = JSON.stringify({
      contact,
      operatorAttribution,
      operatorTaxDisclosure
    });
    expect(publicIdentity).not.toMatch(/Fredrik/i);
    expect(publicIdentity).not.toMatch(/Kornelind/i);
    expect(publicIdentity).not.toMatch(/registration in progress/i);
    expect(publicIdentity).not.toMatch(/not VAT registered/i);
    expect(publicIdentity).not.toMatch(/fkornelind@/);
    expect(publicIdentity).not.toMatch(/personnummer/i);
    expect(contact).not.toHaveProperty("vatNumber");
    expect(contact).not.toHaveProperty("orgNumber");
    expect(contact).not.toHaveProperty("address");
  });

  it("provides mailto links for every public email address", () => {
    expect(contactLinks.general).toBe(`mailto:${contact.email.general}`);
    expect(contactLinks.support).toBe(`mailto:${contact.email.support}`);
    expect(contactLinks.privacy).toBe(`mailto:${contact.email.privacy}`);
    expect(contactLinks.billing).toBe(`mailto:${contact.email.billing}`);
  });
});

