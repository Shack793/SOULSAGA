import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { canAccess } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Streams the PDF only to people who own it. Supports Range requests so large books open quickly. */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const product = await db.query.products.findFirst({ where: eq(schema.products.slug, params.slug) });
  if (!product?.pdfPath) return new NextResponse("Not found", { status: 404 });
  if (!(await canAccess(await getUser(), product))) return new NextResponse("Purchase required", { status: 403 });

  // pdfPath is a bare file name we generated; basename() guards against path tricks anyway.
  const file = path.join(process.cwd(), "uploads", "books", path.basename(product.pdfPath));
  if (!fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
  const size = fs.statSync(file).size;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? parseInt(range[1], 10) : 0;
    const end = range[2] ? Math.min(parseInt(range[2], 10), size - 1) : size - 1;
    if (start >= size || start > end) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new NextResponse(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
