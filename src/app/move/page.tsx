import type { Metadata } from "next";
import { MovePlanner } from "./move-planner";
import "./move.css";

export const metadata: Metadata = {
  title: "Moving box labels with QR — see what's inside every box",
  description: "Print a QR label for every moving box. Scan any box to see its full contents, search “which box has the kettle?”, colour-coded rooms. 8 boxes free. No app, no account.",
  alternates: { canonical: "/move" },
  openGraph: { url: "/move", title: "StayTag Move — never open the wrong box again", description: "QR moving-box labels. Scan to see what's inside. No app, no account." }
};

export default function MovePage() {
  return <main className="mv-page"><MovePlanner /></main>;
}
