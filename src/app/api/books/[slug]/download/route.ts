import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/orders";

export const dynamic = "force-dynamic";

/**
 * Downloads the PDF as an attachment. Always requires a signed-in account (the
 * "sign up to download" rule), and paid books also require a purchase.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const product = await db.query.products.findFirst({ where: eq(schema.products.slug, params.slug) });
  if (!product?.pdfPath) return new NextResponse("Not found", { status: 404 });

  const user = await getUser();
  if (!user) {
    const next = encodeURIComponent(`/store/${product.slug}`);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }
  if (!(await canAccess(user, product))) {
    return NextResponse.redirect(new URL(`/store/${product.slug}`, req.url));
  }

  const file = path.join(process.cwd(), "uploads", "books", path.basename(product.pdfPath));
  if (!fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });

  const safeName = product.title.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80) || "ebook";
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Content-Length": String(fs.statSync(file).size),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
