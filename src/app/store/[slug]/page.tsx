import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Bot, Star } from "lucide-react";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/orders";
import { startCheckout } from "@/app/actions/checkout";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const find = (slug: string) => db.query.products.findFirst({ where: eq(schema.products.slug, slug) });

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await find(params.slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description.slice(0, 155),
    openGraph: { title: p.title, description: p.description.slice(0, 155), images: p.coverUrl ? [p.coverUrl] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams: { payment?: string } }) {
  const p = await find(params.slug);
  if (!p || !p.published) notFound();

  const user = await getUser();
  const [owned, reviews] = await Promise.all([
    canAccess(user, p),
    db.select().from(schema.testimonials).where(eq(schema.testimonials.productId, p.id)).orderBy(desc(schema.testimonials.createdAt)).limit(6),
  ]);
  const toc = (p.toc || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const free = p.priceMinor === 0;

  return (
    <div className="container-x py-10">
      <div className="grid gap-8 md:grid-cols-[320px_1fr]">
        <div className="card3d overflow-hidden self-start">
          <div className="aspect-[3/4] bg-gradient-to-br from-saga-600/30 to-ink-800">
            {p.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt={p.title} className="h-full w-full object-cover" />}
          </div>
        </div>

        <div>
          <span className="text-xs uppercase tracking-widest text-saga-400">{p.kind}</span>
          <h1 className="mt-1 font-display text-4xl font-semibold">{p.title}</h1>
          {p.author && <p className="mt-1 text-white/60">by {p.author}</p>}
          <p className="mt-5 whitespace-pre-line leading-relaxed text-white/80">{p.description}</p>

          {searchParams.payment === "unavailable" && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">Checkout is unavailable right now. Please try again shortly.</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="text-3xl font-semibold text-ember-400">{formatMoney(p.priceMinor, p.currency)}</span>
            {owned ? (
              p.pdfPath ? <Link href={`/store/${p.slug}/read`} className="btn-primary">Read now</Link> : <span className="text-white/60">You own this.</span>
            ) : (
              <form action={startCheckout}>
                <input type="hidden" name="productId" value={p.id} />
                <button className="btn-primary">{user ? "Buy with card or MoMo" : "Log in to buy"}</button>
              </form>
            )}
          </div>
          {!owned && !free && <p className="mt-2 text-xs text-white/40">Secure checkout by Paystack · Visa, Mastercard, MTN MoMo, Telecel Cash, AirtelTigo Money</p>}

          {toc.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">What&apos;s inside</h2>
              <ol className="mt-3 space-y-1.5 text-white/75">
                {toc.map((t, i) => (
                  <li key={i} className="flex gap-3"><span className="w-6 shrink-0 text-right text-white/35">{i + 1}.</span>{t}</li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      {reviews.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Reader reflections</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="card3d p-5">
                {r.rating > 0 && <div className="flex gap-0.5 text-ember-400">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>}
                <blockquote className="text-sm text-white/80">{r.body}</blockquote>
                <figcaption className="mt-3 flex items-center gap-2 text-xs text-white/50">
                  {r.authorName}
                  {r.aiGenerated && <span title="Written by the site's AI assistant from the book's content. Not a customer review." className="inline-flex items-center gap-1 rounded-full bg-saga-500/20 px-2 py-0.5 text-[11px] text-saga-400"><Bot size={11} /> AI</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
