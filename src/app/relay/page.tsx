import { publicPageMetadata } from "@/lib/seo";
import { RelayBoard } from "./relay-board";
import "./relay.css";

export const metadata = publicPageMetadata("/relay", 'Share a refill shopping list from your QR labels', 'Collect refills from different QR labels into one shopping list. Send exact searches and quantities to the person who buys. No account needed.');
export default function RelayPage() { return <main className="relay-page"><RelayBoard /></main>; }
