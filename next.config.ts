import type { NextConfig } from "next";
import { legacyHosts, siteUrl } from "./src/lib/site";

/**
 * Former domain → new domain, permanently. Path and query are kept by the rule; browsers re-attach
 * the #fragment (where tag payloads live) to the redirect target, so every printed QR keeps working.
 * /api stays served on the legacy host so in-flight clients and health checks never break.
 */
export const legacyRedirects = legacyHosts.map(host => ({
  source: "/:path((?!api/).*)",
  has: [{ type: "host" as const, value: host }],
  destination: `${siteUrl}/:path`,
  permanent: true
}));

const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const productionUpgradePolicy = process.env.NODE_ENV === "development" ? "" : " upgrade-insecure-requests";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return legacyRedirects;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${developmentScriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.ebay.com https://www.ebay.co.uk https://www.ebay.de https://www.ebay.fr https://www.ebay.it https://www.ebay.es https://www.ebay.com.au https://www.ebay.ca;${productionUpgradePolicy}`
          }
        ]
      }
    ];
  }
};

export default nextConfig;
