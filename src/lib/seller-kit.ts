export type KitLanguage = "en" | "sv" | "zh";
export type SellerKit = { v: 1; seller: string; product: string; sku: string; language: KitLanguage; links: { region: string; url: string }[] };
export const KIT_MAX_ENCODED = 2200;
export const kitCopy = {
  en: { scan: "SCAN TO REORDER", choose: "Choose your store", sku: "Item / SKU", open: "Open product", note: "Seller-provided links. StayTag has not verified this seller, product, price or compatibility. Check the destination before buying.", privacy: "This QR is a fixed, public snapshot. No automatic purchase. Links may include the creator’s affiliate tracking.", create: "Create a card for your product" },
  sv: { scan: "SKANNA FÖR ÅTERKÖP", choose: "Välj din butik", sku: "Artikelnummer", open: "Öppna produkt", note: "Länkarna är angivna av skaparen. StayTag har inte verifierat säljaren, produkten, priset eller kompatibiliteten. Kontrollera adressen före köp.", privacy: "Denna QR-kod är en fast, offentlig kopia. Inget köps automatiskt. Länkar kan innehålla skaparens affiliatemärkning.", create: "Skapa ett kort för din produkt" },
  zh: { scan: "扫码再次购买", choose: "选择商店", sku: "商品编号", open: "打开商品", note: "链接由创建者提供。StayTag 未验证卖家、商品、价格或兼容性。购买前请检查目标网址。", privacy: "此二维码是固定的公开快照，不会自动购买。链接可能包含创建者的推广跟踪参数。", create: "为您的商品创建卡片" }
};
function clean(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return text.length && text.length <= max ? text : null;
}
// Validate syntax only. No URL is fetched or followed by the server.
export function safeSellerUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 400 || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return null;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || host.endsWith(".") || /(^|\.)(localhost|local|internal|test|invalid)$/.test(host) || /^[\d.]+$/.test(host) || host.includes(":") || host.includes("xn--")) return null;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
    return url.href.length <= 400 ? url.href : null;
  } catch { return null; }
}
export function validateSellerKit(input: unknown): SellerKit | null {
  if (!input || typeof input !== "object") return null;
  const v = input as Record<string, unknown>;
  const seller = clean(v.seller, 60), product = clean(v.product, 80), sku = clean(v.sku, 60);
  if (v.v !== 1 || !seller || !product || !sku || !["en", "sv", "zh"].includes(String(v.language)) || !Array.isArray(v.links) || v.links.length < 1 || v.links.length > 3) return null;
  const links: SellerKit["links"] = [];
  for (const row of v.links) {
    if (!row || typeof row !== "object") return null;
    const region = clean(row.region, 32), url = safeSellerUrl(row.url);
    if (!region || !url) return null;
    links.push({ region, url });
  }
  return { v: 1, seller, product, sku, language: v.language as KitLanguage, links };
}
export function encodeSellerKit(input: SellerKit): string {
  const kit = validateSellerKit(input);
  if (!kit) throw new Error("Check the seller, product, SKU and HTTPS links. Use full public product URLs without passwords, fragments or custom ports.");
  let binary = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(kit))) binary += String.fromCharCode(byte);
  const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  if (encoded.length > KIT_MAX_ENCODED) throw new Error("Too much data for a reliable printed QR. Shorten names or remove an extra store link.");
  return encoded;
}
export function decodeSellerKit(encoded: string | null): SellerKit | null {
  if (!encoded || encoded.length > KIT_MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    return validateSellerKit(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(padded), c => c.charCodeAt(0)))));
  } catch { return null; }
}
export function buildSellerKitUrl(origin: string, kit: SellerKit): string {
  const url = new URL(origin);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("An HTTP origin is required.");
  url.username = ""; url.password = ""; url.pathname = "/reorder"; url.search = "";
  url.hash = `kit=${encodeSellerKit(kit)}`;
  return url.href;
}

