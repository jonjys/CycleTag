/**
 * "Photo → contents": read the item names from a photo of an open moving box.
 * The image is sent to Anthropic once and never stored or logged by StayTag.
 */
import Anthropic from "@anthropic-ai/sdk";
import { MAX_ITEMS } from "./move";

export const PHOTO_MAX_BYTES = 1_500_000;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

export type PhotoResult = { status: "ok"; items: string[] } | { status: "invalid" | "unavailable" | "refused" };

const schema = {
  type: "object",
  properties: { items: { type: "array", items: { type: "string" } } },
  required: ["items"],
  additionalProperties: false,
} as const;

/** Trim, de-duplicate and cap the model's list so it always fits a box label. */
export function cleanItems(raw: unknown, max = MAX_ITEMS): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    if (typeof value !== "string") continue;
    const item = value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

type Client = Pick<Anthropic, "beta" | "messages">;
type Reply = { stop_reason: string | null; content: { type: string; text?: string }[] };

function prompt(language: "en" | "sv") {
  return `This is a photo of an open moving box. List the distinct household items you can see, as short names someone would search for later (e.g. "kettle", "phone charger", "bath towels"). ${language === "sv" ? "Write the names in Swedish." : "Write the names in English."} Group many identical small things into one entry ("mugs", "books"). Skip the box, packing paper and tape. If you cannot see any items, return an empty list. At most ${MAX_ITEMS} items.`;
}

export async function readItemsFromPhoto(data: string, mediaType: PhotoType, language: "en" | "sv", client: Client | null): Promise<PhotoResult> {
  if (!client) return { status: "unavailable" };
  const messages = [{
    role: "user" as const,
    content: [
      { type: "image" as const, source: { type: "base64" as const, media_type: mediaType, data } },
      { type: "text" as const, text: prompt(language) },
    ],
  }];
  const format = { type: "json_schema" as const, schema };
  // The fallback chain and effort are beta features; if the account rejects them, retry once as a plain request.
  const attempts: (() => Promise<Reply>)[] = [
    () => client.beta.messages.create({ model: "claude-opus-5-5", max_tokens: 2000, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default", output_config: { effort: "low", format }, messages }),
    () => client.messages.create({ model: "claude-opus-5-5", max_tokens: 2000, output_config: { format }, messages }),
  ];
  for (const attempt of attempts) {
    try {
      const response = await attempt();
      if (response.stop_reason === "refusal") return { status: "refused" };
      const text = response.content.find((block) => block.type === "text")?.text;
      if (!text) return { status: "unavailable" };
      return { status: "ok", items: cleanItems((JSON.parse(text) as { items?: unknown }).items) };
    } catch (error) {
      if (!(error instanceof Anthropic.BadRequestError)) {
        console.error("move-photo: request failed", error instanceof Error ? error.message : "unknown");
        return { status: "unavailable" };
      }
      console.error("move-photo: bad request", error.message);
    }
  }
  return { status: "invalid" };
}

export function photoClient(key = process.env.ANTHROPIC_API_KEY): Anthropic | null {
  return key ? new Anthropic({ apiKey: key, timeout: 45_000, maxRetries: 1 }) : null;
}
