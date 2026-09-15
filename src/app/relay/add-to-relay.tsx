"use client";
import Link from "next/link";
import { useState } from "react";
import { ShoppingBasket } from "lucide-react";
import { addRelayItem, relayItemFromTag } from "@/lib/relay";
import type { TagPayload } from "@/lib/tag";

export function AddToRelay({ tag }: { tag: TagPayload }) {
  const [message, setMessage] = useState("");
  return <div className="relay-add no-print">
    <button type="button" className="secondary-button" onClick={() => {
      try { setMessage(addRelayItem(relayItemFromTag(tag)) === "added" ? "Added on this device. Scan more labels, then share your list." : "Already on your list. Adjust the quantity in Refill Relay."); }
      catch (error) { setMessage(error instanceof Error ? error.message : "Could not add this item."); }
    }}><ShoppingBasket size={18} aria-hidden="true" /> Need this — add to list</button>
    <p role="status" aria-live="polite">{message}</p>
    <Link href="/relay">Open Refill Relay →</Link>
  </div>;
}
