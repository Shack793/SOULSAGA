"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { extractPdfText, guessToc, saveImage, savePdf } from "@/lib/uploads";

export type ProductState = { error?: string } | undefined;

export async function createProduct(_: ProductState, fd: FormData): Promise<ProductState> {
  await requireAdmin();
  const title = String(fd.get("title") || "").trim();
  const description = String(fd.get("description") || "").trim();
  if (title.length < 3) return { error: "Enter a title." };
  if (description.length < 10) return { error: "Enter a description (at least a sentence)." };

  const price = parseFloat(String(fd.get("price") || "0"));
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be 0 or more." };

  try {
    const cover = await saveImage(fd.get("cover") as File | null, "covers");
    const pdf = await savePdf(fd.get("pdf") as File | null);
    const pdfText = pdf ? await extractPdfText(pdf.buffer) : null;
    const toc = String(fd.get("toc") || "").trim() || (pdfText ? guessToc(pdfText) : "");

    let slug = slugify(title);
    if (await db.query.products.findFirst({ where: eq(schema.products.slug, slug) })) slug = `${slug}-${Date.now().toString(36)}`;

    await db.insert(schema.products).values({
      slug,
      title,
      author: String(fd.get("author") || "").trim() || null,
      kind: fd.get("kind") === "COURSE" ? "COURSE" : "BOOK",
      description,
      coverUrl: cover,
      priceMinor: Math.round(price * 100),
      pdfPath: pdf?.name ?? null,
      pdfText,
      toc: toc || null,
      aiEnabled: fd.get("aiEnabled") === "on",
      published: fd.get("published") !== "off",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save the product." };
  }
  revalidatePath("/store");
  redirect("/admin/products");
}

export async function toggleProductFlag(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id"));
  const flag = fd.get("flag") === "aiEnabled" ? "aiEnabled" : "published";
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id) });
  if (!p) return;
  await db.update(schema.products).set({ [flag]: !p[flag] }).where(eq(schema.products.id, id));
  revalidatePath("/admin/products");
  revalidatePath("/store");
}
