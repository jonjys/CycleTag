import type { Market } from "./tag";
const countries: Record<string, Market> = { US: "US", GB: "UK", UK: "UK", DE: "DE", FR: "FR", IT: "IT", ES: "ES", AU: "AU", CA: "CA" };
export function marketForCountry(country?: string | null): Market {
  return countries[(country ?? "").toUpperCase()] ?? "DE";
}
export function marketForLanguage(language: string): Market {
  const parts = language.replaceAll("_", "-").split("-");
  // Language alone is not a country. English without a region does not imply US.
  return marketForCountry(parts.length > 1 ? parts[parts.length - 1] : undefined);
}
