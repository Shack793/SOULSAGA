import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { formatMoney, timeAgo } from "@/lib/utils";

export const metadata = { title: "My dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [orders, posts, ads] = await Promise.all([
    db
      .select({ o: schema.orders, p: schema.products })
      .from(schema.orders)
      .innerJoin(schema.products, eq(schema.orders.productId, schema.products.id))
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt)),
    db.select().from(schema.forumPosts).where(eq(schema.forumPosts.userId, user.id)).orderBy(desc(schema.forumPosts.createdAt)).limit(10),
    db.select().from(schema.ads).where(eq(schema.ads.userId, user.id)).orderBy(desc(schema.ads.createdAt)),
  ]);
  const library = orders.filter((r) => r.o.status === "PAID");

  return (
    <div className="container-x py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Hi, {user.name.split(" ")[0]}</h1>
          <p className="text-white/60">{user.email}</p>
        </div>
        <form action={logout}><button className="btn-ghost">Log out</button></form>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="card3d p-5 lg:col-span-2">
          <h2 className="font-display text-xl font-semibold">My library</h2>
          {library.length === 0 ? (
            <p className="mt-3 text-white/60">Nothing yet. <Link href="/store" className="text-saga-400 underline">Browse the store</Link>.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10">
              {library.map(({ o, p }) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-white/50">Paid {formatMoney(o.amountMinor, o.currency)}</p>
                  </div>
                  <Link href={`/store/${p.slug}/read`} className="btn-primary !min-h-[38px]">Read</Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card3d p-5">
          <h2 className="font-display text-xl font-semibold">My ads</h2>
          {ads.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">No ads yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {ads.map((a) => (
                <li key={a.id} className="flex justify-between"><span>{a.title}</span><span className="text-white/50">{a.status}</span></li>
              ))}
            </ul>
          )}
        </section>

        <section className="card3d p-5 lg:col-span-3">
          <h2 className="font-display text-xl font-semibold">My recent forum activity</h2>
          {posts.length === 0 ? (
            <p className="mt-3 text-white/60">You haven&apos;t posted yet. <Link href="/forum" className="text-saga-400 underline">Visit the forum</Link>.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10">
              {posts.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="line-clamp-1">{p.title || p.body}</span>
                  <span className="shrink-0 text-white/40">{timeAgo(p.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
