import { ImageResponse } from "next/og";

export const alt = "CycleTag QR reorder labels for replacement parts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f1e9",
          color: "#12120f",
          fontFamily: "Arial, sans-serif",
          padding: 58,
          position: "relative"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 34, width: 650 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 42, fontWeight: 900 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: "#d7ff43",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 34
              }}
            >
              CT
            </div>
            CycleTag
          </div>
          <div style={{ fontSize: 78, lineHeight: 0.96, fontWeight: 950, letterSpacing: -4 }}>
            Free QR reorder labels.
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.25, color: "#5f5d55" }}>
            Stick it on filters, toner, vacuum bags and appliance parts. Scan when it is time to buy again.
          </div>
          <div style={{ display: "flex", gap: 18, fontSize: 26, fontWeight: 800, color: "#164b34" }}>
            <span>No app</span>
            <span>·</span>
            <span>No account</span>
            <span>·</span>
            <span>Free to use</span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 58,
            top: 78,
            width: 390,
            height: 474,
            border: "4px solid #12120f",
            background: "#fffaf0",
            padding: 30,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{ fontSize: 26, color: "#f1643a", fontWeight: 900 }}>REORDER LABEL</div>
          <div
            style={{
              alignSelf: "center",
              width: 210,
              height: 210,
              background:
                "repeating-linear-gradient(90deg,#111 0 18px,#fff 18px 36px), repeating-linear-gradient(0deg,transparent 0 18px,rgba(255,255,255,.72) 18px 36px)",
              border: "16px solid #fff",
              boxShadow: "0 0 0 4px #111"
            }}
          />
          <div style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 950 }}>Scan. Reorder. Repeat.</div>
        </div>
      </div>
    ),
    size
  );
}
