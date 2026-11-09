import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { ArrowRight, BookOpen, Bot, MessagesSquare, Briefcase } from "lucide-react";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/site";
import { formatMoney } from "@/lib/utils";
import Slider from "@/components/Slider";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [s, slides, products, articles, rooms] = await Promise.all([
    getSettings(),
    db.select().from(schema.slides).where(eq(schema.slides.active, true)).orderBy(asc(schema.slides.sort)),
    db.select().from(schema.products).where(eq(schema.products.published, true)).orderBy(desc(schema.products.createdAt)).limit(4),
    db.select().from(schema.articles).where(eq(schema.articles.published, true)).orderBy(desc(schema.articles.publishedAt)).limit(3),
    db.select().from(schema.rooms).orderBy(asc(schema.rooms.sort)).limit(4),
  ]);

  return (
    <div className="container-x">
      {/* Hero */}
      <section className="relative grid items-center gap-10 py-14 sm:py-20 md:grid-cols-2">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Bot size={14} className="text-saga-400" /> AI-assisted community & library
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
            {s.heroTitle}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/65">{s.heroSubtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/store" className="btn-primary">Browse books <ArrowRight size={16} /></Link>
            <Link href="/forum" className="btn-ghost">Join the forum</Link>
          </div>
        </div>

        {/* 3D floating scene */}
        <div className="relative mx-auto h-64 w-full max-w-sm sm:h-80 [perspective:1000px]" aria-hidden>
          <div className="orb absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 animate-float rounded-full sm:h-56 sm:w-56" />
          <div className="card3d absolute left-2 top-6 h-24 w-20 animate-float !rounded-xl bg-gradient-to-br from-saga-500/40 to-transparent [animation-delay:-2s]" />
          <div className="card3d absolute bottom-4 right-2 h-28 w-24 animate-float !rounded-xl bg-gradient-to-br from-ember-500/30 to-transparent [animation-delay:-4s]" />
        </div>
      </section>

      {slides.length > 0 && <section className="pb-14"><Slider slides={slides} /></section>}

      {/* Sections */}
      <section className="grid gap-4 pb-14 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/blog", icon: BookOpen, t: "Blog", d: "Daily articles that solve real problems." },
          { href: "/forum", icon: MessagesSquare, t: "Forum", d: "Chat rooms, questions and answers." },
          { href: "/store", icon: BookOpen, t: "Books & Courses", d: "Read online or buy with card / MoMo." },
          { href: "/opportunities", icon: Briefcase, t: "Opportunities", d: "Jobs and listings from the community." },
        ].map((c) => (
          <Link key={c.href} href={c.href} className="card3d p-5">
            <c.icon className="text-saga-400" />
            <h3 className="mt-3 font-display text-lg font-semibold">{c.t}</h3>
            <p className="mt-1 text-sm text-white/60">{c.d}</p>
          </Link>
        ))}
      </section>

      {products.length > 0 && (
        <section className="pb-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold">New in the library</h2>
            <Link href="/store" className="text-sm text-saga-400">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {products.map((p) => (
              <Link key={p.id} href={`/store/${p.slug}`} className="card3d overflow-hidden">
                <div className="aspect-[3/4] bg-gradient-to-br from-saga-600/30 to-ink-800">
                  {p.coverUrl && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverUrl} alt={p.title} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-ember-400">{formatMoney(p.priceMinor, p.currency)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="pb-14">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-3xl font-semibold">Latest articles</h2>
            <Link href="/blog" className="text-sm text-saga-400">All articles</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/blog/${a.slug}`} className="card3d p-5">
                <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-white/60">{a.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {rooms.length > 0 && (
        <section>
          <h2 className="mb-5 font-display text-3xl font-semibold">Chat rooms</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {rooms.map((r) => (
              <Link key={r.id} href={`/forum/${r.slug}`} className="card3d flex items-center gap-4 p-5">
                <span className="text-3xl">{r.icon}</span>
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-white/60">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
