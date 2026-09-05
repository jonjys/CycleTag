import { ImageResponse } from "next/og";

export const alt = "CycleTag - Scan. Reorder. Repeat.";
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
          alignItems: "center",
          background: "radial-gradient(800px at 20% 40%, #1e40ff 0%, #1a1a2e 40%, #0a0a0f 100%), radial-gradient(600px at 80% 80%, #7c3aed 0%, transparent 70%)",
          padding: 60,
          fontFamily: "Arial, sans-serif",
          position: "relative"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div
            style={{
              width: 180,
              height: 180,
              borderRadius: 32,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 90,
            }}
          >
            ◧
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 96, fontWeight: 900, color: "white", letterSpacing: -4, lineHeight: 1 }}>
              CycleTag
            </div>
            <div style={{ fontSize: 42, color: "#a5b4fc", marginTop: 12, fontWeight: 600 }}>
              Scan. Reorder. Repeat.
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
