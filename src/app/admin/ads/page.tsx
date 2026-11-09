import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveAdPlan, toggleAdPlan, postAdForMember, setAdStatus } from "@/app/actions/admin";
import { Err, Field, imgHint } from "@/components/AdminUI";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Ads" };
export const dynamic = "force-dynamic";

export default async function AdminAds({ searchParams }: { searchParams: { error?: string } }) {
  const [plans, ads] = await Promise.all([
    db.select().from(schema.adPlans),
    db.select({ ad: schema.ads, plan: schema.adPlans, user: schema.users }).from(schema.ads)
      .innerJoin(schema.adPlans, eq(schema.ads.planId, schema.adPlans.id)).leftJoin(schema.users, eq(schema.ads.userId, schema.users.id)).orderBy(desc(schema.ads.createdAt)),
  ]);
  return (
    <div className="space-y-10">
      <Err msg={searchParams.error} />
      <section>
        <h1 className="font-display text-3xl font-semibold">Ad plans</h1>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="card3d p-4">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-white/60">{formatMoney(p.priceMinor, p.currency)} · {p.durationDays} days · {p.placement.replace("FORUM_", "Forum ").toLowerCase()}</p>
              <form action={toggleAdPlan} className="mt-3"><input type="hidden" name="id" value={p.id} /><button className="rounded-full bg-white/10 px-3 py-1 text-xs">{p.active ? "Active – click to disable" : "Disabled – click to enable"}</button></form>
            </div>
          ))}
        </div>
        <form action={saveAdPlan} className="card3d mt-4 grid gap-3 p-4 sm:grid-cols-5">
          <input name="name" placeholder="Plan name" className="input sm:col-span-2" required />
          <input name="price" type="number" step="0.01" min="0" placeholder="Price GHS" className="input" required />
          <input name="days" type="number" min="1" placeholder="Days" className="input" required />
          <select name="placement" className="input"><option value="FORUM_SIDEBAR">Sidebar</option><option value="FORUM_INLINE">Inline</option><option value="FORUM_TOP">Top banner</option></select>
          <button className="btn-primary sm:col-span-5">Add plan</button>
        </form>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <h2 className="font-display text-2xl font-semibold">All ads</h2>
          <div className="mt-4 space-y-3">
            {ads.length === 0 && <p className="text-white/60">No ads yet.</p>}
            {ads.map(({ ad, plan, user }) => (
              <div key={ad.id} className="card3d flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">{ad.title}</p>
                  <p className="text-sm text-white/50">{ad.status} · {plan.name} · {user ? user.email : "admin"} · {ad.impressions} views · {ad.clicks} clicks</p>
                </div>
                <form action={setAdStatus}><input type="hidden" name="id" value={ad.id} /><input type="hidden" name="status" value={ad.status === "ACTIVE" ? "EXPIRED" : "ACTIVE"} />
                  <button className="rounded-full bg-white/10 px-3 py-1 text-xs">{ad.status === "ACTIVE" ? "Stop" : "Activate"}</button></form>
              </div>
            ))}
          </div>
        </div>
        <form action={postAdForMember} className="card3d space-y-4 self-start p-5">
          <h2 className="font-display text-xl font-semibold">Post an ad (on behalf of a member)</h2>
          <Field label="Member email (optional)"><input name="memberEmail" type="email" className="input" /></Field>
          <Field label="Plan"><select name="planId" className="input" required>{plans.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Title"><input name="title" className="input" required /></Field>
          <Field label="Text"><input name="body" className="input" /></Field>
          <Field label="Link"><input name="linkUrl" placeholder="https://…" className="input" required /></Field>
          <Field label="Image" hint={imgHint("ad")}><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></Field>
          <button className="btn-primary w-full">Go live now</button>
        </form>
      </section>
    </div>
  );
}
