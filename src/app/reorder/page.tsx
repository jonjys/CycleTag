import type { Metadata } from "next";
import { SellerReorder } from "./seller-reorder";
import "../sellers/sellers.css";
export const metadata: Metadata = { title: "Seller reorder card", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function ReorderPage() { return <main className="seller-page"><SellerReorder /></main>; }
