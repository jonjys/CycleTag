import type { Metadata } from "next";
import { SpacesBuilder } from "./spaces-builder";
import "./spaces.css";

export const metadata: Metadata = {
  title: "Spaces — One QR. Every refill.",
  description: "Put up to six replacement items behind one printable QR. Share a kitchen, office or workshop refill list. No app. No account.",
  alternates: { canonical: "/spaces" }
};

export default function SpacesPage() {
  return <main className="spaces-page"><SpacesBuilder /></main>;
}
