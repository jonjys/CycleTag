import { publicPageMetadata } from "@/lib/seo";
import { SpacesBuilder } from "./spaces-builder";
import "./spaces.css";

export const metadata = publicPageMetadata("/spaces", 'Shared refill QR labels for kitchens, offices & workshops', 'Put up to six replacement items behind one printable QR label. Share exact parts in a kitchen, office or workshop refill list. No app or account.');

export default function SpacesPage() {
  return <main className="spaces-page"><SpacesBuilder /></main>;
}
