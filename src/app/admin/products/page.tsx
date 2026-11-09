import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { toggleProductFlag } from "@/app/actions/products";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Books & Courses" };
export const dynamic = "force-dynamic";

function Flag({ id, flag, on, label }: { id: string; flag: string; on: boolean; label: string }) {
  return (
    <form action={toggleProductFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="flag" value={flag} />
      <button className={`rounded-full px-3 py-1 text-xs ${on ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/50"}`}>
        {label}: {on ? "on" : "off"}
      </button>
    </form>
  );
}

export default async function AdminProducts() {
  const items = await db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">Books &amp; Courses</h1>
        <Link href="/admin/products/new" className="btn-primary">Add new</Link>
      </div>
      <div className="mt-6 space-y-3">
        {items.length === 0 && <p className="text-white/60">No products yet.</p>}
        {items.map((p) => (
          <div key={p.id} className="card3d flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-white/50">
                {p.kind} · {formatMoney(p.priceMinor, p.currency)} · {p.pdfPath ? (p.pdfText ? "PDF + text for AI" : "PDF (no readable text)") : "no PDF"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Flag id={p.id} flag="published" on={p.published} label="Published" />
              <Flag id={p.id} flag="aiEnabled" on={p.aiEnabled} label="AI bot" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
