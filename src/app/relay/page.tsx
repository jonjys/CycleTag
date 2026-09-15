import type { Metadata } from "next";
import { RelayBoard } from "./relay-board";
import "./relay.css";

export const metadata: Metadata = {
  title: "Refill Relay — Scan it. Send it. Sorted.",
  description: "Collect refills from different QR labels into one shopping list. Send exact searches and quantities to the person who buys. No account needed.",
  alternates: { canonical: "/relay" }
};
export default function RelayPage() { return <main className="relay-page"><RelayBoard /></main>; }
