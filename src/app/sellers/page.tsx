import { publicPageMetadata } from "@/lib/seo";
import { SellerBuilder } from "./seller-builder";
import "./sellers.css";
export const metadata = publicPageMetadata("/sellers", 'Printable QR reorder cards for sellers & product packages', 'Create a free printable reorder card with your product SKU and your own store links. English, Swedish and Chinese. No account needed.');
export default function SellersPage() { return <main className="seller-page"><SellerBuilder /></main>; }
