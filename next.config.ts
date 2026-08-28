import type { NextConfig } from "next";

const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const productionUpgradePolicy = process.env.NODE_ENV === "development" ? "" : " upgrade-insecure-requests";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
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
