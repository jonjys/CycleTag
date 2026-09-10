import type { Metadata } from "next";
import { SpaceView } from "./space-view";
import "../spaces/spaces.css";

export const metadata: Metadata = { title: "Shared refill space", robots: { index: false, follow: false } };
export default function SpacePage() { return <main className="spaces-page"><SpaceView /></main>; }
