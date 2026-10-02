/**
 * Server-side Move Pass check. Asks Stripe whether a Checkout Session from the Move Pass
 * Payment Link was actually paid. Needs only a restricted key with Checkout Sessions: Read.
 * Nothing is stored or logged; the session id is not echoed back.
 */
import { validSessionId } from "./move";

export const MOVE_PAYMENT_LINK = "plink_1ULnTSBEo0Yzuylwi1M59J00";

export type VerifyResult =
  | { status: "paid" }
  | { status: "unpaid" | "invalid" | "wrong_product" }
  | { status: "unavailable" };

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

export async function verifyPassSession(session: unknown, key: string | undefined, fetchImpl: Fetch = fetch): Promise<VerifyResult> {
  if (typeof session !== "string" || !validSessionId(session)) return { status: "invalid" };
  if (!key || !/^(rk|sk)_(live|test)_[A-Za-z0-9]+$/.test(key)) return { status: "unavailable" };
  let response: Response;
  try {
    response = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session)}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
  } catch { return { status: "unavailable" }; }
  if (response.status === 404) return { status: "invalid" };
  if (!response.ok) return { status: "unavailable" };
  let data: { payment_status?: unknown; status?: unknown; payment_link?: unknown };
  try { data = await response.json(); } catch { return { status: "unavailable" }; }
  if (data.payment_link !== MOVE_PAYMENT_LINK) return { status: "wrong_product" };
  if (data.status !== "complete" || data.payment_status !== "paid") return { status: "unpaid" };
  return { status: "paid" };
}
