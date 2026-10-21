// No public database client. This function has its own service-key authentication.
import { readSharedAction } from "../_shared/moving-day.ts";

const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))), b => b.toString(16).padStart(2, "0")).join("");
const reply = (status: string, code: number, data: object = {}) => Response.json({ status, ...data }, { status: code, headers: { "Cache-Control": "no-store" } });
const codes: Record<string, number> = { ok: 200, deleted: 200, invalid: 400, forbidden: 403, not_found: 404, conflict: 409, load_first: 409, limited: 429 };

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return reply("forbidden", 405);
  const serviceKey = request.headers.get("x-staytag-service");
  if (!serviceKey || !/^[A-Za-z0-9_-]{43}$/.test(serviceKey)) return reply("forbidden", 403);
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const dbKey = keys.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !dbKey) return reply("unavailable", 503);
    const headers: Record<string, string> = { apikey: dbKey, "Content-Type": "application/json" };
    if (!dbKey.startsWith("sb_secret_")) headers.Authorization = `Bearer ${dbKey}`;
    // Only hashes are stored. The server key grants access to this function, never the Data API.
    const configResponse = await fetch(`${url}/rest/v1/staytag_share_services?key_hash=eq.${await digest(serviceKey)}&select=environment`, { headers });
    if (!configResponse.ok) return reply("unavailable", 503);
    const configs = await configResponse.json();
    if (configs.length !== 1) return reply("forbidden", 403);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 70_000) return reply("invalid", 413);
    const input = JSON.parse(raw);
    const action = readSharedAction(input);
    if (!action) return reply("invalid", 400);
    const data = { ...action.data };
    if (typeof data.helper === "string") { data.helper_hash = await digest(data.helper); delete data.helper; }
    const response = await fetch(`${url}/rest/v1/rpc/staytag_shared_action`, {
      method: "POST", headers,
      body: JSON.stringify({ p_environment: configs[0].environment, p_action: action.action, p_id: action.id, p_key_hash: await digest(action.key), p_data: data, p_client_hash: typeof input.clientHash === "string" ? input.clientHash : "" }),
    });
    if (!response.ok) return reply("unavailable", 503);
    const result = await response.json();
    return Response.json(result, { status: codes[result.status] || 503, headers: { "Cache-Control": "no-store" } });
  } catch { return reply("unavailable", 503); }
});
