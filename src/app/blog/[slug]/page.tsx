import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { renderMarkdown, readingMinutes } from "@/lib/markdown";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

const find = (slug: string) =>
  db.query.articles.findFirst({ where: and(eq(schema.articles.slug, slug), eq(schema.articles.published, true)) });

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await find(params.slug);
  if (!a) return {};
  const title = a.metaTitle || a.title;
  const description = a.metaDesc || a.excerpt;
  return {
    title,
    description,
    keywords: a.keywords?.split(",").map((k) => k.trim()).filter(Boolean),
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: "article", title, description, url: `${SITE}/blog/${a.slug}`, publishedTime: a.publishedAt?.toISOString(), images: a.coverUrl ? [a.coverUrl.startsWith("http") ? a.coverUrl : `${SITE}${a.coverUrl}`] : undefined },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Article({ params }: { params: { slug: string } }) {
  const a = await find(params.slug);
  if (!a) notFound();

  await db.insert(schema.viewEvents).values({ kind: "ARTICLE", refId: a.id, path: `/blog/${a.slug}` });

  const [product, related] = await Promise.all([
    a.productId ? db.query.products.findFirst({ where: eq(schema.products.id, a.productId) }) : null,
    db.select().from(schema.articles).where(and(eq(schema.articles.published, true), ne(schema.articles.id, a.id))).orderBy(desc(schema.articles.publishedAt)).limit(3),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.metaDesc || a.excerpt,
    datePublished: a.publishedAt?.toISOString(),
    image: a.coverUrl ? [a.coverUrl.startsWith("http") ? a.coverUrl : `${SITE}${a.coverUrl}`] : undefined,
    mainEntityOfPage: `${SITE}/blog/${a.slug}`,
    publisher: { "@type": "Organization", name: process.env.NEXT_PUBLIC_SITE_NAME || "SoulSaga" },
  };

  return (
    <article className="container-x max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/blog" className="text-sm text-saga-400">← Blog</Link>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">{a.title}</h1>
      <p className="mt-3 text-sm text-white/45">
        {a.publishedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · {readingMinutes(a.body)} min read
        {a.aiGenerated && " · Written with AI from the book’s content"}
      </p>
      {a.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.coverUrl} alt={a.title} className="mt-6 aspect-[1200/630] w-full rounded-2xl object-cover" />}
      <div className="prose-saga mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />

      {product && (
        <aside className="card3d mt-12 flex items-center gap-4 p-5">
          <div className="h-24 w-[72px] shrink-0 overflow-hidden rounded-lg bg-ink-700">
            {product.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={product.coverUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-saga-400">Go deeper</p>
            <p className="font-display text-lg font-semibold">{product.title}</p>
            <p className="text-sm text-ember-400">{formatMoney(product.priceMinor, product.currency)}</p>
          </div>
          <Link href={`/store/${product.slug}`} className="btn-primary shrink-0">View</Link>
        </aside>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">More to read</h2>
          <ul className="mt-3 space-y-2">
            {related.map((r) => (<li key={r.id}><Link className="text-saga-400 underline underline-offset-2" href={`/blog/${r.slug}`}>{r.title}</Link></li>))}
          </ul>
        </section>
      )}
    </article>
  );
}
