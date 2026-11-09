import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { readingMinutes } from "@/lib/markdown";

export const metadata = {
  title: "Blog",
  description: "Practical articles that solve real problems, drawn from the books in our library.",
  alternates: { canonical: "/blog" },
};
export const dynamic = "force-dynamic";
const PER_PAGE = 12;

export default async function Blog({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const rows = await db
    .select()
    .from(schema.articles)
    .where(eq(schema.articles.published, true))
    .orderBy(desc(schema.articles.publishedAt))
    .limit(PER_PAGE + 1)
    .offset((page - 1) * PER_PAGE);
  const more = rows.length > PER_PAGE;
  const items = rows.slice(0, PER_PAGE);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl font-semibold">Blog</h1>
      <p className="mt-2 text-white/60">Clear answers to real problems.</p>

      {items.length === 0 ? (
        <p className="mt-12 text-white/60">No articles yet. Check back soon.</p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.id} href={`/blog/${a.slug}`} className="card3d overflow-hidden">
              <div className="aspect-[1200/630] bg-gradient-to-br from-saga-600/30 to-ink-800">
                {a.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={a.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl font-semibold">{a.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{a.excerpt}</p>
                <p className="mt-3 text-xs text-white/40">{readingMinutes(a.body)} min read</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        {page > 1 ? <Link className="btn-ghost" href={`/blog?page=${page - 1}`}>← Newer</Link> : <span />}
        {more && <Link className="btn-ghost" href={`/blog?page=${page + 1}`}>Older →</Link>}
      </div>
    </div>
  );
}
