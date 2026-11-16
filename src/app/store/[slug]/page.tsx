import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ArrowLeft, BookOpen, Bot, CheckCircle2, Download, Lock, Star } from "lucide-react";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/orders";
import { startCheckout } from "@/app/actions/checkout";
import { formatMoney } from "@/lib/utils";
import BookCover3D from "@/components/BookCover3D";

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
  const preview = (p.pdfText || "").trim().slice(0, 1600);
  const free = p.priceMinor === 0;
  const nextPath = `/store/${p.slug}`;

  return (
    <div className="container-x py-8 sm:py-10">
      <Link href="/store" className="inline-flex items-center gap-1.5 text-sm text-saga-400">
        <ArrowLeft size={15} /> Back to the library
      </Link>

      {/* 3D feature panel */}
      <section className="relative mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-saga-600/15 via-ink-900/70 to-ink-950 p-5 shadow-[0_40px_120px_-60px_rgba(139,92,246,0.9)] sm:p-8 md:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-saga-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-ember-500/10 blur-3xl" />

        <div className="relative grid items-center gap-10 md:grid-cols-[minmax(0,380px)_1fr]">
          <BookCover3D coverUrl={p.coverUrl} title={p.title} author={p.author} kind={p.kind} className="mx-auto" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-saga-400/30 bg-saga-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-saga-300">
                {p.kind}
              </span>
              {p.pdfPath && (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
                  PDF ebook
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                <BookOpen size={12} /> Read online
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">{p.title}</h1>
            {p.author && <p className="mt-2 text-white/60">by {p.author}</p>}

            <p className="mt-5 max-w-2xl whitespace-pre-line leading-relaxed text-white/80">{p.description}</p>

            {searchParams.payment === "unavailable" && (
              <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Checkout is unavailable right now. Please try again shortly.
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-end gap-x-6 gap-y-3">
              <span className="font-display text-4xl font-semibold text-ember-400">{formatMoney(p.priceMinor, p.currency)}</span>
              {free && <span className="pb-1 text-sm text-emerald-300">Free to read online</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {owned && p.pdfPath ? (
                <Link href={`/store/${p.slug}/read`} className="btn-primary">
                  <BookOpen size={16} /> Read online now
                </Link>
              ) : !owned ? (
                <form action={startCheckout}>
                  <input type="hidden" name="productId" value={p.id} />
                  <button className="btn-primary">{user ? "Buy with card or MoMo" : "Log in to buy"}</button>
                </form>
              ) : null}

              {preview && (
                <a href="#preview" className="btn-ghost">
                  Read a free preview
                </a>
              )}

              {!user ? (
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn-ghost">
                  <Download size={16} /> Sign up to download
                </Link>
              ) : owned && p.pdfPath ? (
                <a href={`/api/books/${p.slug}/download`} className="btn-ghost">
                  <Download size={16} /> Download PDF
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/45">
                  <Lock size={15} /> Download after purchase
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-white/40">
              {!user
                ? "Reading is open to everyone. A free account unlocks PDF downloads."
                : owned
                  ? "You can read this online or download the PDF to keep."
                  : "Secure checkout by Paystack · Visa, Mastercard, MTN MoMo, Telecel Cash, AirtelTigo Money"}
            </p>

            <ul className="mt-6 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
              <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300" /> Read online in the browser</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300" /> Free account to download</li>
              {p.aiEnabled && <li className="flex items-center gap-2"><Bot size={15} className="text-saga-300" /> Ask the AI about this book</li>}
              <li className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-300" /> Works on phone and desktop</li>
            </ul>
          </div>
        </div>
      </section>

      {preview && (
        <section id="preview" className="mt-8 scroll-mt-24">
          <div className="card3d overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Free preview</h2>
              <span className="rounded-full bg-saga-500/15 px-3 py-1 text-[11px] uppercase tracking-widest text-saga-300">
                From the book
              </span>
            </div>
            <div className="relative mt-4 max-h-72 overflow-hidden">
              <p className="whitespace-pre-line leading-relaxed text-white/75">{preview}</p>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {owned && p.pdfPath ? (
                <Link href={`/store/${p.slug}/read`} className="btn-primary">Continue reading</Link>
              ) : (
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn-primary">
                  Join free to keep reading
                </Link>
              )}
              <span className="text-xs text-white/45">The full book is waiting inside.</span>
            </div>
          </div>
        </section>
      )}

      {toc.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">What&apos;s inside</h2>
          <ol className="mt-4 grid gap-2 text-white/75 sm:grid-cols-2">
            {toc.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
                <span className="w-6 shrink-0 text-right font-semibold text-saga-400">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

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
