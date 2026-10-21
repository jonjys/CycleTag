import type { Metadata } from "next";
import { MovingDay } from "./moving-day";
import "../move.css";
import "./moving-day.css";

export const metadata: Metadata = {
  title: "Moving day — loaded, delivered, accounted for",
  description: "A shared box check for your moving day. See what is loaded, what has arrived and which box numbers still need checking.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function MovingDayPage() { return <main className="mv-page md-page"><MovingDay /></main>; }
