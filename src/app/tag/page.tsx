import type { Metadata } from "next";
import { TagView } from "./tag-view";

export const metadata: Metadata = {
  title: "Care history",
  description: "Read the care chain, exact part, last replacement and next due date.",
  alternates: { canonical: "/tag" },
  robots: { index: false, follow: false }
};

export default function TagPage() {
  return (
    <main className="tag-page">
      <TagView />
    </main>
  );
}
