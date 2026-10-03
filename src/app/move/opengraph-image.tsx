import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "StayTag QR moving box labels — print, scan and find your things";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f4f1e9", color: "#183e2c", padding: "64px", alignItems: "center", gap: "60px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "650px" }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, marginBottom: 30 }}>NYTTO LABS / STAYTAG</div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>QR moving box labels.</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 28 }}>Print. Scan. Find your things.</div>
        <div style={{ display: "flex", fontSize: 25, marginTop: 32 }}>3 boxes free · No app or account</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", background: "white", width: "330px", border: "3px solid #183e2c", borderRadius: 20, padding: 30 }}>
        <div style={{ display: "flex", fontSize: 24 }}>KITCHEN</div>
        <div style={{ display: "flex", fontSize: 74, fontWeight: 700, marginTop: 12 }}>BOX 07</div>
        <div style={{ display: "flex", fontSize: 25, marginTop: 20 }}>Coffee mugs</div>
        <div style={{ display: "flex", fontSize: 25, marginTop: 8 }}>Coffee grinder</div>
        <div style={{ display: "flex", fontSize: 19, marginTop: 30 }}>staytag.nyttolabs.com</div>
      </div>
    </div>, size
  );
}
