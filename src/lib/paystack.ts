import crypto from "node:crypto";

const BASE = "https://api.paystack.co";
const key = () => {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return k;
};

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

type InitArgs = { email: string; amountMinor: number; reference: string; currency: string; metadata?: Record<string, unknown> };

/** Starts a hosted checkout. Card and Ghana mobile money (MTN / Telecel / AirtelTigo) are both enabled. */
export async function initializeTransaction(a: InitArgs) {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: a.email,
      amount: a.amountMinor,
      currency: a.currency,
      reference: a.reference,
      callback_url: `${siteUrl()}/api/pay/verify`,
      channels: ["card", "mobile_money"],
      metadata: a.metadata,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack initialize failed");
  return json.data as { authorization_url: string; access_code: string; reference: string };
}

export type PaystackTx = { status: string; reference: string; amount: number; currency: string; channel: string };

export async function verifyTransaction(reference: string) {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) throw new Error(json.message || "Paystack verify failed");
  return json.data as PaystackTx;
}

/** Paystack signs webhooks with HMAC-SHA512 of the raw body using your secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", key()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
