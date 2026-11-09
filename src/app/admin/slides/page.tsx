import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveSlide, deleteSlide } from "@/app/actions/admin";
import { Err, Field, imgHint, Del } from "@/components/AdminUI";

export const metadata = { title: "Slider" };
export const dynamic = "force-dynamic";

export default async function AdminSlides({ searchParams }: { searchParams: { error?: string } }) {
  const slides = await db.select().from(schema.slides).orderBy(asc(schema.slides.sort));
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <div>
        <h1 className="font-display text-3xl font-semibold">Home slider</h1>
        <p className="mt-2 text-sm text-white/60">{imgHint("slide")} Any size works: images are cropped to fit on every screen.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {slides.length === 0 && <p className="text-white/60">No slides yet.</p>}
          {slides.map((s) => (
            <div key={s.id} className="card3d overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.imageUrl} alt="" className="aspect-[16/7] w-full object-cover" />
              <div className="flex items-center justify-between p-3"><span className="text-sm">{s.title || "(no title)"}</span><Del action={deleteSlide} id={s.id} /></div>
            </div>
          ))}
        </div>
      </div>
      <form action={saveSlide} className="card3d space-y-4 self-start p-5">
        <h2 className="font-display text-xl font-semibold">Add a slide</h2>
        <Err msg={searchParams.error} />
        <Field label="Image" hint={imgHint("slide")}><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="input" required /></Field>
        <Field label="Title"><input name="title" className="input" /></Field>
        <Field label="Subtitle"><input name="subtitle" className="input" /></Field>
        <Field label="Link (optional)" hint="e.g. /store or https://…"><input name="linkUrl" className="input" /></Field>
        <Field label="Order (1 = first)"><input name="sort" type="number" defaultValue={1} className="input" /></Field>
        <button className="btn-primary w-full">Add slide</button>
      </form>
    </div>
  );
}
