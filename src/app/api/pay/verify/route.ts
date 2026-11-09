import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { verifyTransaction, siteUrl } from "@/lib/paystack";
import { settleOrder } from "@/lib/orders";

/** Paystack sends the buyer here after checkout. We never trust the query string: we ask Paystack. */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref");
  const base = siteUrl();
  if (!ref) return NextResponse.redirect(`${base}/store`);

  try {
    const tx = await verifyTransaction(ref);
    const result = await settleOrder(tx);
    const order = await db.query.orders.findFirst({ where: eq(schema.orders.reference, ref) });
    const product = order && (await db.query.products.findFirst({ where: eq(schema.products.id, order.productId) }));
    if (result.ok && product) return NextResponse.redirect(`${base}/store/${product.slug}/read?paid=1`);
    return NextResponse.redirect(`${base}/store${product ? `/${product.slug}` : ""}?payment=failed`);
  } catch {
    return NextResponse.redirect(`${base}/store?payment=error`);
  }
}
