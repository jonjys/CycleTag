export const contact = {
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
} as const;

export const contactLinks = {
  operator: contact.operatorWebsite,
  general: `mailto:${contact.email.general}`,
  support: `mailto:${contact.email.support}`,
  privacy: `mailto:${contact.email.privacy}`,
  billing: `mailto:${contact.email.billing}`
} as const;
