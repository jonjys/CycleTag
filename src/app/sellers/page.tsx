import type { Metadata } from "next";
import { SellerBuilder } from "./seller-builder";
import "./sellers.css";
export const metadata: Metadata = { title: "Seller Kits — Your package. Your next sale.", description: "Create a printable reorder card with your product SKU and your own store links. English, Swedish and Chinese. No account needed.", alternates: { canonical: "/sellers" } };
export default function SellersPage() { return <main className="seller-page"><SellerBuilder /></main>; }
