import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatMoney } from "@/lib/utils";

export const metadata = {
  title: "Books & Courses",
  description: "Read online or buy digital books and courses with card or mobile money.",
};
export const dynamic = "force-dynamic";

export default async function Store({ searchParams }: { searchParams: { kind?: string; payment?: string } }) {
  const kind = searchParams.kind === "COURSE" || searchParams.kind === "BOOK" ? searchParams.kind : null;
  const all = await db.select().from(schema.products).where(eq(schema.products.published, true)).orderBy(desc(schema.products.createdAt));
  const items = kind ? all.filter((p) => p.kind === kind) : all;

  const tabs = [
    { label: "All", href: "/store", on: !kind },
    { label: "Books", href: "/store?kind=BOOK", on: kind === "BOOK" },
    { label: "Courses", href: "/store?kind=COURSE", on: kind === "COURSE" },
  ];

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl font-semibold">Books &amp; Courses</h1>
      <p className="mt-2 text-white/60">Pay once with card or mobile money, then read online anytime.</p>

      {searchParams.payment && (
        <p role="status" className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {searchParams.payment === "failed" ? "That payment wasn't completed. You haven't been charged for it." : "We couldn't confirm your payment. If you were charged, it will unlock automatically shortly."}
        </p>
      )}

      <div className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <Link key={t.label} href={t.href} className={t.on ? "btn-primary !min-h-[38px]" : "btn-ghost !min-h-[38px]"}>{t.label}</Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-white/60">Nothing here yet. Check back soon.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <Link key={p.id} href={`/store/${p.slug}`} className="card3d overflow-hidden">
              <div className="relative aspect-[3/4] bg-gradient-to-br from-saga-600/30 to-ink-800">
                {p.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt={p.title} className="h-full w-full object-cover" loading="lazy" />}
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] uppercase tracking-wide backdrop-blur">{p.kind}</span>
              </div>
              <div className="p-3 sm:p-4">
                <h2 className="line-clamp-2 text-sm font-semibold sm:text-base">{p.title}</h2>
                {p.author && <p className="mt-0.5 line-clamp-1 text-xs text-white/50">{p.author}</p>}
                <p className="mt-2 font-semibold text-ember-400">{formatMoney(p.priceMinor, p.currency)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
