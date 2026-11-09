import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { timeAgo, isHttpUrl } from "@/lib/utils";

export const metadata = { title: "Opportunities", description: "Jobs and opportunities shared with the community." };
export const dynamic = "force-dynamic";

export default async function Opportunities() {
  const jobs = await db.select().from(schema.jobs).where(eq(schema.jobs.published, true)).orderBy(desc(schema.jobs.createdAt));
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl font-semibold">Opportunities</h1>
      <p className="mt-2 text-white/60">Jobs and openings shared with the community.</p>
      <div className="mt-8 space-y-4">
        {jobs.length === 0 && <p className="text-white/60">Nothing posted yet. Check back soon.</p>}
        {jobs.map((j) => {
          const a = j.applyUrl;
          const href = a ? (isHttpUrl(a) ? a : `mailto:${a}`) : null;
          return (
            <article key={j.id} className="card3d p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-display text-xl font-semibold">{j.title}</h2><p className="text-sm text-white/55">{[j.company, j.location].filter(Boolean).join(" · ")} · {timeAgo(j.createdAt)}</p></div>
                {href && <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="btn-primary !min-h-[38px]">Apply</a>}
              </div>
              <p className="mt-3 whitespace-pre-line text-white/75">{j.description}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
