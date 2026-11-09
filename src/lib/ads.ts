import { and, eq, sql } from "drizzle-orm";
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

/** Picks one live ad for a placement (random among active, in-date ads) and counts the impression. */
export async function getAd(placement: string) {
  const now = new Date();
  const rows = await db
    .select({ ad: schema.ads })
    .from(schema.ads)
    .innerJoin(schema.adPlans, eq(schema.ads.planId, schema.adPlans.id))
    .where(and(eq(schema.ads.status, "ACTIVE"), eq(schema.adPlans.placement, placement)));
  const live = rows.map((r) => r.ad).filter((a) => (!a.startsAt || a.startsAt <= now) && (!a.endsAt || a.endsAt >= now));
  if (!live.length) return null;
  const ad = live[Math.floor(Math.random() * live.length)];
  await db.update(schema.ads).set({ impressions: sql`${schema.ads.impressions} + 1` }).where(eq(schema.ads.id, ad.id));
  return ad;
}
