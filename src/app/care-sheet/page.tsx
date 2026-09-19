import type { Metadata } from "next";
import { CareSheet } from "./sheet";
export const metadata: Metadata = { title: "Care Sheet preview", robots: { index: false, follow: false } };
export default function Page() { return <main className="care-sheet-page"><CareSheet /></main>; }
