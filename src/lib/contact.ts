export const contact = {
  productName: "StayTag",
  operatorName: "Nytto Labs",
  operatorWebsite: "https://nyttolabs.com",
  country: "Sweden",
  legalForm: "Swedish sole trader",
  fTaxStatus: "Approved for F-tax",
  vatStatus: "Registered for VAT",
  email: {
    general: "hello@nyttolabs.com",
    support: "support@nyttolabs.com",
    privacy: "privacy@nyttolabs.com",
    billing: "billing@nyttolabs.com"
  }
} as const;

export const contactLinks = {
  operator: contact.operatorWebsite,
  general: `mailto:${contact.email.general}`,
  support: `mailto:${contact.email.support}`,
  privacy: `mailto:${contact.email.privacy}`,
  billing: `mailto:${contact.email.billing}`
} as const;

export const operatorAttribution = contact.operatorName;

export const operatorLegalLine = "Nytto Labs, operated by Fredrik Kornelind · F-tax";

export const operatorTaxDisclosure = `${contact.fTaxStatus}. ${contact.vatStatus}.`;
