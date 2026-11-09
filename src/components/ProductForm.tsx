"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProduct, type ProductState } from "@/app/actions/products";
import { IMAGE_SPECS } from "@/lib/images";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? "Uploading and reading the PDF…" : "Save product"}</button>;
}

export default function ProductForm() {
  const [state, action] = useFormState<ProductState, FormData>(createProduct, undefined);
  return (
    <form action={action} className="card3d max-w-2xl space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label" htmlFor="title">Title</label><input id="title" name="title" className="input" required /></div>
        <div><label className="label" htmlFor="author">Author</label><input id="author" name="author" className="input" /></div>
        <div>
          <label className="label" htmlFor="kind">Type</label>
          <select id="kind" name="kind" className="input"><option value="BOOK">Book</option><option value="COURSE">Course</option></select>
        </div>
        <div><label className="label" htmlFor="price">Price (GHS, 0 = free)</label><input id="price" name="price" type="number" min="0" step="0.01" defaultValue="0" className="input" /></div>
      </div>

      <div><label className="label" htmlFor="description">Description</label><textarea id="description" name="description" rows={5} className="input" required /></div>

      <div>
        <label className="label" htmlFor="cover">Cover image</label>
        <input id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" className="input" />
        <p className="mt-1 text-xs text-white/50">{IMAGE_SPECS.cover.note}</p>
      </div>

      <div>
        <label className="label" htmlFor="pdf">Book PDF</label>
        <input id="pdf" name="pdf" type="file" accept="application/pdf" className="input" />
        <p className="mt-1 text-xs text-white/50">Up to 50 MB. Readers see it in the in-site reader; the AI reads its text. Scanned (image-only) PDFs can&apos;t be read by the AI.</p>
      </div>

      <div>
        <label className="label" htmlFor="toc">Table of contents (one chapter per line)</label>
        <textarea id="toc" name="toc" rows={6} className="input" placeholder="Leave blank to auto-detect “Chapter 1…” lines from the PDF" />
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="aiEnabled" /> Let the AI bot use this book (articles, forum, testimonials)</label>
      </div>

      {state?.error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}
      <Submit />
    </form>
  );
}
