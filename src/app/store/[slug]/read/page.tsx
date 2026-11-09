import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/orders";
import PdfReader from "@/components/PdfReader";

export const metadata = { title: "Reader", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Read({ params, searchParams }: { params: { slug: string }; searchParams: { paid?: string } }) {
  const p = await db.query.products.findFirst({ where: eq(schema.products.slug, params.slug) });
  if (!p) notFound();

  const user = await getUser();
  if (!user && p.priceMinor > 0) redirect(`/login?next=${encodeURIComponent(`/store/${p.slug}/read`)}`);
  if (!(await canAccess(user, p))) redirect(`/store/${p.slug}`);

  return (
    <div className="container-x py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/store/${p.slug}`} className="text-sm text-saga-400">← {p.title}</Link>
          {searchParams.paid && <p role="status" className="mt-1 text-sm text-emerald-300">Payment confirmed. Enjoy your book!</p>}
        </div>
      </div>
      {p.pdfPath ? (
        <PdfReader src={`/api/books/${p.slug}/file`} title={p.title} />
      ) : (
        <p className="py-20 text-center text-white/60">The file for this title hasn&apos;t been uploaded yet.</p>
      )}
    </div>
  );
}
