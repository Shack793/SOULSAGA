import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const dynamic = "force-dynamic";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, products, rooms] = await Promise.all([
    db.select().from(schema.articles).where(eq(schema.articles.published, true)),
    db.select().from(schema.products).where(eq(schema.products.published, true)),
    db.select().from(schema.rooms),
  ]);
  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/forum`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE}/store`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/opportunities`, changeFrequency: "daily", priority: 0.6 },
    ...articles.map((a) => ({ url: `${SITE}/blog/${a.slug}`, lastModified: a.publishedAt ?? a.createdAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${SITE}/store/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...rooms.map((r) => ({ url: `${SITE}/forum/${r.slug}`, changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}
