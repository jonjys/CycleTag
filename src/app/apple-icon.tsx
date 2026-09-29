import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const cell = (left: number, top: number, w: number, h: number) => <div style={{ position: "absolute", left, top, width: w, height: h, background: "#dfff55", borderRadius: 4 }} />;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#171713" }}>
      {cell(40, 40, 40, 40)}{cell(100, 40, 40, 40)}{cell(40, 100, 40, 40)}{cell(106, 106, 12, 12)}{cell(128, 106, 12, 12)}{cell(106, 128, 34, 12)}
    </div>,
    size
  );
}
