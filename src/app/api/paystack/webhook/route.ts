import { NextRequest, NextResponse } from "next/server";
import { validWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { settleOrder } from "@/lib/orders";
import { activateAdByReference } from "@/lib/ads";

/**
 * Set this URL as the webhook in the Paystack dashboard: {SITE_URL}/api/paystack/webhook
 * Catches payments where the buyer closed the tab before returning to the site (common with MoMo prompts).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data: { reference: string } };
  if (event.event === "charge.success") {
    // Re-verify with Paystack rather than trusting the webhook body.
    const tx = await verifyTransaction(event.data.reference);
    await settleOrder(tx);
    await activateAdByReference(tx);
  }
  return NextResponse.json({ ok: true });
}
