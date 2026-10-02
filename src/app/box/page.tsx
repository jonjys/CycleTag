import type { Metadata } from "next";
import { BoxView } from "./box-view";
import "../move/move.css";

export const metadata: Metadata = { title: "Moving box contents", robots: { index: false, follow: false } };

export default function BoxPage() {
  return <main className="mv-page box-page"><BoxView /></main>;
}
