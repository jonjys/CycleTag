import { publicPageMetadata } from "@/lib/seo";
import { ReturnWallet } from "./return-wallet";
import "./returns.css";

export const metadata = publicPageMetadata("/returns", 'Return QR code wallet — deadlines & refund reminders', 'Keep retailer-issued return QR codes, deadlines and refund reminders together on your device. No account. Use the return method supplied by your shop.');

export default function ReturnsPage() {
  return <main className="rw-page"><ReturnWallet /></main>;
}
