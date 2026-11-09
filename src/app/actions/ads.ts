"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { initializeTransaction } from "@/lib/paystack";
import { saveImage } from "@/lib/uploads";
import { isHttpUrl } from "@/lib/utils";

/** A member buys an ad plan: the ad is created PENDING and only goes live once Paystack confirms payment. */
export async function buyAd(fd: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard/ads/new");
  const plan = await db.query.adPlans.findFirst({ where: eq(schema.adPlans.id, String(fd.get("planId"))) });
  const title = String(fd.get("title") || "").trim(), link = String(fd.get("linkUrl") || "").trim();
  if (!plan || !plan.active || title.length < 3 || !isHttpUrl(link)) redirect("/dashboard/ads/new?error=Check+the+plan%2C+title+and+https+link");

  let img: string | null = null;
  try { img = await saveImage(fd.get("image") as File | null, "ads"); } catch (e) { redirect(`/dashboard/ads/new?error=${encodeURIComponent((e as Error).message)}`); }

  const reference = `AD-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(schema.ads).values({ title, body: String(fd.get("body") || "").trim() || null, imageUrl: img, linkUrl: link, planId: plan.id, userId: user.id, status: "PENDING", paymentRef: reference });

  let url: string;
  try {
    url = (await initializeTransaction({ email: user.email, amountMinor: plan.priceMinor, currency: plan.currency, reference, metadata: { adPlan: plan.id } })).authorization_url;
  } catch { redirect("/dashboard/ads/new?error=Checkout+is+unavailable+right+now"); }
  redirect(url);
}
