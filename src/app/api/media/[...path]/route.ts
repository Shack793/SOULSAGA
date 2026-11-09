import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
};

/** Serves public images (covers, slides, ad banners) from uploads/media. PDFs are NOT served here. */
export async function GET(_: NextRequest, { params }: { params: { path: string[] } }) {
  const root = path.join(process.cwd(), "uploads", "media");
  const file = path.normalize(path.join(root, ...params.path));
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!file.startsWith(root + path.sep) || !type || !fs.existsSync(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(fs.readFileSync(file), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
