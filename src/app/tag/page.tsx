import type { Metadata } from "next";
import { TagView } from "./tag-view";

export const metadata: Metadata = {
  title: "Reorder tag",
  description: "Open a stateless CycleTag replacement and reorder reminder.",
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
