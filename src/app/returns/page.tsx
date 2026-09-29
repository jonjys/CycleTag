import type { Metadata } from "next";
import { ReturnWallet } from "./return-wallet";
import "./returns.css";

export const metadata: Metadata = {
  title: "Return Wallet — Never print a return label again",
  description: "Keep return QR codes from Zalando, Amazon, H&M and every web shop in one place. Deadlines, full-screen code at the counter, refund tracking. Saved on your phone. No account.",
  alternates: { canonical: "/returns" },
  openGraph: { url: "/returns", title: "StayTag Return Wallet", description: "Your returns. Ready when the cashier asks. No account, saved on your phone." }
};

export default function ReturnsPage() {
  return <main className="rw-page"><ReturnWallet /></main>;
}
