import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { PaystackTx } from "./paystack";

/** Activates a member's paid ad once Paystack confirms the payment (wired up with the ads section). */
export async function activateAdByReference(tx: PaystackTx) {
  if (tx.status !== "success") return;
  const ad = await db.query.ads.findFirst({ where: eq(schema.ads.paymentRef, tx.reference) });
  if (!ad || ad.status === "ACTIVE") return;
  const plan = await db.query.adPlans.findFirst({ where: eq(schema.adPlans.id, ad.planId) });
  if (!plan || tx.amount !== plan.priceMinor || tx.currency !== plan.currency) return;
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + plan.durationDays * 86400_000);
  await db.update(schema.ads).set({ status: "ACTIVE", startsAt, endsAt }).where(eq(schema.ads.id, ad.id));
}
