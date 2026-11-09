import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSettings } from "@/lib/site";
import { saveSettings, saveMenuItem, updateMenuItem } from "@/app/actions/admin";
import { Err, Field } from "@/components/AdminUI";

export const metadata = { title: "Site & Menu" };
export const dynamic = "force-dynamic";

export default async function AdminSite({ searchParams }: { searchParams: { error?: string } }) {
  const [s, menu] = await Promise.all([getSettings(), db.select().from(schema.menuItems).orderBy(asc(schema.menuItems.sort))]);
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={saveSettings} className="card3d space-y-4 p-5">
        <h1 className="font-display text-2xl font-semibold">Site</h1>
        <Field label="Site name"><input name="siteName" defaultValue={s.siteName} className="input" /></Field>
        <Field label="Tagline"><input name="tagline" defaultValue={s.tagline} className="input" /></Field>
        <Field label="Home headline"><input name="heroTitle" defaultValue={s.heroTitle} className="input" /></Field>
        <Field label="Home sub-headline"><textarea name="heroSubtitle" defaultValue={s.heroSubtitle} rows={2} className="input" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="botAutoPublish" defaultChecked={s.botAutoPublish !== "false"} /> AI articles publish automatically (untick to review them as drafts first)</label>
        <button className="btn-primary">Save</button>
      </form>
      <div className="space-y-4">
        <div className="card3d p-5">
          <h2 className="font-display text-2xl font-semibold">Menu</h2>
          <Err msg={searchParams.error} />
          {menu.length === 0 && <p className="mt-2 text-sm text-white/60">Using the default menu: Blog, Forum, Books &amp; Courses, Opportunities. Add an item below to start customising.</p>}
          <ul className="mt-3 divide-y divide-white/10">
            {menu.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className={m.visible ? "" : "text-white/40 line-through"}>{m.label} <span className="text-white/40">{m.href}</span></span>
                <form action={updateMenuItem} className="flex gap-2"><input type="hidden" name="id" value={m.id} />
                  <button name="op" value="toggle" className="rounded-full bg-white/10 px-3 py-1 text-xs">{m.visible ? "Hide" : "Show"}</button>
                  <button name="op" value="delete" className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-200">Delete</button></form>
              </li>
            ))}
          </ul>
        </div>
        <form action={saveMenuItem} className="card3d space-y-3 p-5">
          <h3 className="font-semibold">Add menu item</h3>
          <div className="grid grid-cols-2 gap-3"><input name="label" placeholder="Label" className="input" required /><input name="href" placeholder="/page or https://…" className="input" required /></div>
          <input name="sort" type="number" placeholder="Order (e.g. 5)" className="input" />
          <button className="btn-ghost">Add</button>
        </form>
      </div>
    </div>
  );
}
