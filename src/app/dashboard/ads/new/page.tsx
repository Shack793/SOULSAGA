import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { buyAd } from "@/app/actions/ads";
import { Err, Field, imgHint } from "@/components/AdminUI";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Place an ad" };
export const dynamic = "force-dynamic";

export default async function NewAd({ searchParams }: { searchParams: { error?: string } }) {
  if (!(await getUser())) redirect("/login?next=/dashboard/ads/new");
  const plans = await db.select().from(schema.adPlans).where(eq(schema.adPlans.active, true));
  return (
    <div className="container-x py-10">
      <form action={buyAd} className="card3d mx-auto max-w-xl space-y-4 p-6">
        <h1 className="font-display text-3xl font-semibold">Place an ad in the forum</h1>
        <Err msg={searchParams.error} />
        <Field label="Plan"><select name="planId" className="input" required>{plans.map((p) => <option key={p.id} value={p.id}>{p.name} – {formatMoney(p.priceMinor, p.currency)}</option>)}</select></Field>
        <Field label="Headline"><input name="title" className="input" required /></Field>
        <Field label="Short text"><input name="body" className="input" /></Field>
        <Field label="Where should it link?"><input name="linkUrl" placeholder="https://…" className="input" required /></Field>
        <Field label="Image (optional)" hint={imgHint("ad")}><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" /></Field>
        <button className="btn-primary w-full">Pay with card or MoMo</button>
        <p className="text-xs text-white/40">Your ad goes live as soon as payment is confirmed.</p>
      </form>
    </div>
  );
}
