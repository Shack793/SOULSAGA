import { count, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const week = new Date(Date.now() - 7 * 86400_000);
  const [[u], [p], [o], [rev], [views], [topics], [replies], [likes], [clicks], top, runs] = await Promise.all([
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.products),
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, "PAID")),
    db.select({ n: sql<number>`coalesce(sum(${schema.orders.amountMinor}), 0)` }).from(schema.orders).where(eq(schema.orders.status, "PAID")),
    db.select({ n: count() }).from(schema.viewEvents).where(sql`${schema.viewEvents.createdAt} > ${Math.floor(week.getTime() / 1000)}`),
    db.select({ n: count() }).from(schema.forumPosts).where(sql`${schema.forumPosts.parentId} is null`),
    db.select({ n: count() }).from(schema.forumPosts).where(sql`${schema.forumPosts.parentId} is not null`),
    db.select({ n: sql<number>`coalesce(sum(${schema.forumPosts.likes} + ${schema.forumPosts.dislikes}), 0)` }).from(schema.forumPosts),
    db.select({ n: sql<number>`coalesce(sum(${schema.ads.clicks}), 0)` }).from(schema.ads),
    db.select({ a: schema.articles, v: count(schema.viewEvents.id) }).from(schema.articles)
      .leftJoin(schema.viewEvents, eq(schema.viewEvents.refId, schema.articles.id)).groupBy(schema.articles.id).orderBy(desc(count(schema.viewEvents.id))).limit(5),
    db.select().from(schema.botRuns).orderBy(desc(schema.botRuns.createdAt)).limit(5),
  ]);
  const stats = [
    ["Members", u.n], ["Products", p.n], ["Paid orders", o.n], ["Revenue", formatMoney(Number(rev.n))],
    ["Article views (7d)", views.n], ["Forum topics", topics.n], ["Forum replies", replies.n], ["Likes + dislikes", Number(likes.n)], ["Ad clicks", Number(clicks.n)],
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(([l, v]) => <div key={String(l)} className="card3d p-5"><p className="text-sm text-white/50">{l}</p><p className="mt-1 text-3xl font-semibold">{v}</p></div>)}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card3d p-5"><h2 className="font-display text-xl font-semibold">Top articles</h2>
          <ul className="mt-3 divide-y divide-white/10 text-sm">{top.length === 0 && <li className="py-2 text-white/50">No articles yet.</li>}
            {top.map(({ a, v }) => <li key={a.id} className="flex justify-between gap-3 py-2"><span className="line-clamp-1">{a.title}</span><span className="text-white/50">{v} views</span></li>)}</ul></section>
        <section className="card3d p-5"><h2 className="font-display text-xl font-semibold">Recent bot activity</h2>
          <ul className="mt-3 divide-y divide-white/10 text-sm">{runs.length === 0 && <li className="py-2 text-white/50">The bot hasn&apos;t run yet.</li>}
            {runs.map((r) => <li key={r.id} className="flex justify-between gap-3 py-2"><span className="line-clamp-1">{r.status === "ERROR" ? "⚠ " : ""}{r.task}: {r.detail}</span><span className="shrink-0 text-white/40">{timeAgo(r.createdAt)}</span></li>)}</ul></section>
      </div>
    </div>
  );
}
