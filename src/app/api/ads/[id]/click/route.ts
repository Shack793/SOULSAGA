import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";

/** Counts the click, then sends the visitor to the advertiser. Only http(s) targets are allowed. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ad = await db.query.ads.findFirst({ where: eq(schema.ads.id, params.id) });
  if (!ad || !/^https?:\/\//i.test(ad.linkUrl)) return NextResponse.redirect(new URL("/", req.url));
  await db.update(schema.ads).set({ clicks: sql`${schema.ads.clicks} + 1` }).where(eq(schema.ads.id, ad.id));
  return NextResponse.redirect(ad.linkUrl);
}
