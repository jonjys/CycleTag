import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StayTag",
    short_name: "StayTag",
    description: "QR labels that remember the part and the date, plus a private wallet for return codes.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1e9",
    theme_color: "#f4f1e9",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
    shortcuts: [
      { name: "Return Wallet", short_name: "Returns", url: "/returns" },
      { name: "Refill list", short_name: "Refills", url: "/relay" }
    ]
  };
}
