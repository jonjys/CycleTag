import { publicPageMetadata } from "@/lib/seo";
import { MoversOffer } from "./movers-offer";
import "./movers.css";

export const metadata = publicPageMetadata("/movers", "Free QR box labels for your moving customers — StayTag Move for movers", "Give every moving customer printable QR box labels and a searchable box list. Free to add to your booking confirmation. No app, no account, no integration.");

export default function MoversPage() { return <main className="mvp-page"><MoversOffer /></main>; }
