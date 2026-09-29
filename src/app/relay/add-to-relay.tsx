"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBasket } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { measure } from "@/lib/measure-client";
import { addRelayItem, relayItemFromTag } from "@/lib/relay";
import type { TagPayload } from "@/lib/tag";

export function AddToRelay({ tag, source = "tag" }: { tag: TagPayload; source?: "tag" | "space" }) {
  const { t } = useLocale();
  const [message, setMessage] = useState("");
  return <div className="relay-add no-print">
    <button type="button" className="secondary-button" onClick={() => {
      try {
        const added = addRelayItem(relayItemFromTag(tag)) === "added";
        if (added) measure("refill_added", source);
        setMessage(added ? t("Added to your refill list. Scan more labels, then send one list to whoever buys.", "Tillagd i inköpslistan. Skanna fler etiketter och skicka sedan en lista till den som handlar.") : t("Already on your list. Adjust the quantity in Refill Relay.", "Finns redan på listan. Ändra antal i Refill Relay."));
      }
      catch (error) { setMessage(error instanceof Error ? error.message : t("Could not add this item.", "Kunde inte lägga till.")); }
    }}><ShoppingBasket size={18} aria-hidden="true" /> {t("Running low? Add to refill list", "Snart slut? Lägg till i inköpslistan")}</button>
    <p role="status" aria-live="polite">{message}</p>
    {message && <Link href="/relay">{t("Open refill list →", "Öppna inköpslistan →")}</Link>}
  </div>;
}
