"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";
import { canAccess } from "@/lib/orders";

export async function startCheckout(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const product = await db.query.products.findFirst({ where: eq(schema.products.id, productId) });
  if (!product || !product.published) redirect("/store");

  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/store/${product.slug}`)}`);

  if (await canAccess(user, product)) redirect(`/store/${product.slug}/read`);

  const reference = `SS-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(schema.orders).values({
    reference,
    userId: user.id,
    productId: product.id,
    amountMinor: product.priceMinor,
    currency: product.currency,
  });

  let url: string;
  try {
    const init = await initializeTransaction({
      email: user.email,
      amountMinor: product.priceMinor,
      currency: product.currency,
      reference,
      metadata: { productId: product.id, userId: user.id, title: product.title },
    });
    url = init.authorization_url;
  } catch {
    redirect(`/store/${product.slug}?payment=unavailable`);
  }
  redirect(url);
}
