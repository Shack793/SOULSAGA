import { count, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const [[u], [p], [o], [rev]] = await Promise.all([
    db.select({ n: count() }).from(schema.users),
    db.select({ n: count() }).from(schema.products),
    db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.status, "PAID")),
    db.select({ n: sql<number>`coalesce(sum(${schema.orders.amountMinor}), 0)` }).from(schema.orders).where(eq(schema.orders.status, "PAID")),
  ]);
  const stats = [
    { l: "Members", v: u.n }, { l: "Products", v: p.n }, { l: "Paid orders", v: o.n }, { l: "Revenue", v: formatMoney(Number(rev.n)) },
  ];
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Admin</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="card3d p-5"><p className="text-sm text-white/50">{s.l}</p><p className="mt-1 text-3xl font-semibold">{s.v}</p></div>
        ))}
      </div>
    </div>
  );
}
