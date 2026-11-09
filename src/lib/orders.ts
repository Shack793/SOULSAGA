import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SessionUser } from "./auth";
import type { PaystackTx } from "./paystack";

/** True if the user may read the product: free, bought, or an admin. */
export async function canAccess(user: SessionUser | null, product: { id: string; priceMinor: number }) {
  if (product.priceMinor === 0) return true;
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  const paid = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.userId, user.id),
      eq(schema.orders.productId, product.id),
      eq(schema.orders.status, "PAID")
    ),
  });
  return !!paid;
}

/**
 * Marks an order paid after checking Paystack's own record: status must be "success",
 * and the amount and currency must match what we charged. Idempotent, so it is safe to call
 * from both the browser callback and the webhook.
 */
export async function settleOrder(tx: PaystackTx) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.reference, tx.reference) });
  if (!order) return { ok: false as const, reason: "unknown-reference" };
  if (order.status === "PAID") return { ok: true as const, order };

  if (tx.status !== "success") {
    if (tx.status === "failed" || tx.status === "abandoned") {
      await db.update(schema.orders).set({ status: "FAILED" }).where(eq(schema.orders.id, order.id));
    }
    return { ok: false as const, reason: `status-${tx.status}` };
  }
  if (tx.amount !== order.amountMinor || tx.currency !== order.currency) {
    return { ok: false as const, reason: "amount-mismatch" };
  }
  await db
    .update(schema.orders)
    .set({ status: "PAID", channel: tx.channel, paidAt: new Date() })
    .where(eq(schema.orders.id, order.id));
  return { ok: true as const, order };
}
