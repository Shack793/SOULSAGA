import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveJob, deleteJob } from "@/app/actions/admin";
import { Err, Field, Del } from "@/components/AdminUI";

export const metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default async function AdminJobs({ searchParams }: { searchParams: { error?: string } }) {
  const jobs = await db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-display text-3xl font-semibold">Opportunities</h1>
        <div className="mt-6 space-y-3">
          {jobs.length === 0 && <p className="text-white/60">No listings yet.</p>}
          {jobs.map((j) => (
            <div key={j.id} className="card3d flex items-center justify-between gap-3 p-4">
              <div><p className="font-semibold">{j.title}</p><p className="text-sm text-white/50">{[j.company, j.location].filter(Boolean).join(" · ")}</p></div>
              <Del action={deleteJob} id={j.id} />
            </div>
          ))}
        </div>
      </div>
      <form action={saveJob} className="card3d space-y-4 self-start p-5">
        <h2 className="font-display text-xl font-semibold">Post an opportunity</h2>
        <Err msg={searchParams.error} />
        <Field label="Title"><input name="title" className="input" required /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Company"><input name="company" className="input" /></Field><Field label="Location"><input name="location" className="input" /></Field></div>
        <Field label="Description"><textarea name="description" rows={5} className="input" required /></Field>
        <Field label="Apply link or email"><input name="applyUrl" className="input" /></Field>
        <button className="btn-primary w-full">Post</button>
      </form>
    </div>
  );
}
