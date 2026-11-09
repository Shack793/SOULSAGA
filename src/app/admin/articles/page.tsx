import Link from "next/link";
import { desc, eq, count } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveArticle, toggleArticle, deleteArticle } from "@/app/actions/admin";
import { Err, Field, imgHint, Del } from "@/components/AdminUI";

export const metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default async function AdminArticles({ searchParams }: { searchParams: { error?: string } }) {
  const [rows, products] = await Promise.all([
    db.select({ a: schema.articles, v: count(schema.viewEvents.id) }).from(schema.articles)
      .leftJoin(schema.viewEvents, eq(schema.viewEvents.refId, schema.articles.id)).groupBy(schema.articles.id).orderBy(desc(schema.articles.createdAt)),
    db.select().from(schema.products),
  ]);
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-display text-3xl font-semibold">Articles</h1>
        <div className="mt-6 space-y-3">
          {rows.length === 0 && <p className="text-white/60">No articles yet. Write one, or let the AI bot generate them.</p>}
          {rows.map(({ a, v }) => (
            <div key={a.id} className="card3d flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/blog/${a.slug}`} className="font-semibold hover:underline">{a.title}</Link>
                <p className="text-sm text-white/50">{a.published ? "Published" : "Draft"} · {a.aiGenerated ? "AI" : "Manual"} · {v} views{a.sharedFb ? " · shared FB" : ""}{a.sharedIg ? " · shared IG" : ""}</p>
              </div>
              <div className="flex gap-2">
                <form action={toggleArticle}><input type="hidden" name="id" value={a.id} /><button className="rounded-full bg-white/10 px-3 py-1 text-xs">{a.published ? "Unpublish" : "Publish"}</button></form>
                <Del action={deleteArticle} id={a.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <form action={saveArticle} className="card3d space-y-4 self-start p-5">
        <h2 className="font-display text-xl font-semibold">Write an article</h2>
        <Err msg={searchParams.error} />
        <Field label="Title"><input name="title" className="input" required /></Field>
        <Field label="Summary (shows in lists and Google)"><textarea name="excerpt" rows={2} className="input" required /></Field>
        <Field label="Body (markdown: ## headings, - lists)"><textarea name="body" rows={10} className="input" required /></Field>
        <Field label="The problem it solves"><input name="problem" className="input" /></Field>
        <Field label="Keywords (comma separated)"><input name="keywords" className="input" /></Field>
        <Field label="Related book"><select name="productId" className="input"><option value="">None</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
        <Field label="Image" hint={imgHint("article")}><input name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" defaultChecked /> Publish now</label>
        <button className="btn-primary w-full">Save article</button>
      </form>
    </div>
  );
}
