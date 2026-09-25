export const funnelEvents = ["page_view", "label_started", "label_created", "print_requested", "png_downloaded", "outbound_ebay", "outbound_store", "support_checkout_opened"] as const;
export type FunnelEvent = typeof funnelEvents[number];
export const funnelSources = ["home", "tag", "bulk", "care-sheet", "relay", "sellers", "other"] as const;
export type FunnelSource = typeof funnelSources[number];
export type FunnelPayload = { event: FunnelEvent; source: FunnelSource };
export function measurementPayload(value: unknown): FunnelPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== 2 || !funnelEvents.includes(v.event as FunnelEvent) || !funnelSources.includes(v.source as FunnelSource)) return null;
  return { event: v.event as FunnelEvent, source: v.source as FunnelSource };
}
