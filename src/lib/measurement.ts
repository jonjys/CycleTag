// Allowlisted action names only. Never add fields: no item names, codes, URLs, amounts or identifiers.
export const funnelEvents = [
  "page_view", "label_started", "label_created", "print_requested", "png_downloaded", "outbound_ebay", "outbound_store", "support_checkout_opened",
  "tag_scanned", "replacement_logged", "refill_added", "relay_shared", "space_created",
  "return_wallet_opened", "return_added", "return_code_opened", "return_dropped_off", "return_refunded", "return_reminder_added",
  "move_box_added", "move_labels_printed", "move_paywall_shown", "move_checkout_opened", "move_pass_unlocked", "move_photo_read", "box_scanned"
] as const;
export type FunnelEvent = typeof funnelEvents[number];
export const funnelSources = ["home", "tag", "bulk", "care-sheet", "relay", "sellers", "spaces", "space", "returns", "move", "box", "other"] as const;
export type FunnelSource = typeof funnelSources[number];
export type FunnelPayload = { event: FunnelEvent; source: FunnelSource };
export function measurementPayload(value: unknown): FunnelPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || !funnelEvents.includes(v.event as FunnelEvent) || !funnelSources.includes(v.source as FunnelSource)) return null;
  return { event: v.event as FunnelEvent, source: v.source as FunnelSource };
}
