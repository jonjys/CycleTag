import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "StayTag — Every box. Home. QR labels and shared moving-day checks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#f4f1e9", color: "#153f35", padding: "64px", alignItems: "center", gap: "60px" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "650px" }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 3, marginBottom: 30 }}>NYTTO LABS / STAYTAG</div>
        <div style={{ display: "flex", fontSize: 86, fontWeight: 700, lineHeight: 1 }}>Every box.</div>
        <div style={{ display: "flex", fontSize: 86, fontWeight: 700, lineHeight: 1, color: "#df542d" }}>Home.</div>
        <div style={{ display: "flex", fontSize: 27, marginTop: 28 }}>Label. Share. Check every box.</div>
        <div style={{ display: "flex", fontSize: 25, marginTop: 32 }}>3 boxes free · No app or account</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", background: "#153f35", color: "#f4f1e9", width: "330px", borderRadius: 26, padding: 30 }}>
        <div style={{ display: "flex", fontSize: 18, color: "#b9d7ad" }}>MOVING DAY</div>
        <div style={{ display: "flex", fontSize: 74, fontWeight: 700, marginTop: 20 }}>03 / 03</div>
        <div style={{ display: "flex", fontSize: 27, marginTop: 24 }}>All accounted for.</div>
        <div style={{ display: "flex", fontSize: 18, marginTop: 36, color: "#b9d7ad" }}>Loaded. Delivered. Home.</div>
      </div>
    </div>, size
  );
}
