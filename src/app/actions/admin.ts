"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isHttpUrl, slugify } from "@/lib/utils";
import { saveImage } from "@/lib/uploads";
import { runDaily, generateArticle, seedQuestion, answerOpenTopics } from "@/lib/bot";

const s = (fd: FormData, k: string) => String(fd.get(k) || "").trim();
const back = (path: string, error?: string): never => redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);

// ---------- Articles
export async function saveArticle(fd: FormData) {
  await requireAdmin();
  const title = s(fd, "title"), body = s(fd, "body"), excerpt = s(fd, "excerpt");
  if (title.length < 5 || body.length < 50 || excerpt.length < 10) return back("/admin/articles", "Title, summary and body are required.");
  let cover: string | null = null;
  try { cover = await saveImage(fd.get("cover") as File | null, "articles"); } catch (e) { return back("/admin/articles", (e as Error).message); }
  let slug = slugify(title);
  if (await db.query.articles.findFirst({ where: eq(schema.articles.slug, slug) })) slug = `${slug}-${Date.now().toString(36)}`;
  const publish = fd.get("publish") === "on";
  await db.insert(schema.articles).values({
    slug, title, excerpt, body, coverUrl: cover, metaTitle: title.slice(0, 60), metaDesc: s(fd, "metaDesc") || excerpt.slice(0, 160),
    keywords: s(fd, "keywords") || null, problem: s(fd, "problem") || null, productId: s(fd, "productId") || null,
    published: publish, publishedAt: publish ? new Date() : null,
  });
  revalidatePath("/blog"); back("/admin/articles");
}

export async function toggleArticle(fd: FormData) {
  await requireAdmin();
  const a = await db.query.articles.findFirst({ where: eq(schema.articles.id, s(fd, "id")) });
  if (!a) return;
  await db.update(schema.articles).set({ published: !a.published, publishedAt: !a.published ? new Date() : a.publishedAt }).where(eq(schema.articles.id, a.id));
  revalidatePath("/blog"); revalidatePath("/admin/articles");
}

export async function deleteArticle(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.articles).where(eq(schema.articles.id, s(fd, "id")));
  revalidatePath("/blog"); revalidatePath("/admin/articles");
}

// ---------- Slider
export async function saveSlide(fd: FormData) {
  await requireAdmin();
  let img: string | null = null;
  try { img = await saveImage(fd.get("image") as File | null, "slides"); } catch (e) { return back("/admin/slides", (e as Error).message); }
  if (!img) return back("/admin/slides", "Choose an image.");
  const link = s(fd, "linkUrl");
  if (link && !link.startsWith("/") && !isHttpUrl(link)) return back("/admin/slides", "Link must start with / or https://");
  await db.insert(schema.slides).values({ imageUrl: img, title: s(fd, "title") || null, subtitle: s(fd, "subtitle") || null, linkUrl: link || null, sort: Number(s(fd, "sort")) || 0 });
  revalidatePath("/"); back("/admin/slides");
}

export async function deleteSlide(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.slides).where(eq(schema.slides.id, s(fd, "id")));
  revalidatePath("/"); revalidatePath("/admin/slides");
}

// ---------- Menu + site settings
export async function saveMenuItem(fd: FormData) {
  await requireAdmin();
  const label = s(fd, "label"), href = s(fd, "href");
  if (!label || (!href.startsWith("/") && !isHttpUrl(href))) return back("/admin/site", "Menu needs a label and a link starting with / or https://");
  await db.insert(schema.menuItems).values({ label, href, sort: Number(s(fd, "sort")) || 99 });
  revalidatePath("/", "layout"); back("/admin/site");
}

export async function updateMenuItem(fd: FormData) {
  await requireAdmin();
  const id = s(fd, "id");
  if (fd.get("op") === "delete") await db.delete(schema.menuItems).where(eq(schema.menuItems.id, id));
  else {
    const m = await db.query.menuItems.findFirst({ where: eq(schema.menuItems.id, id) });
    if (m) await db.update(schema.menuItems).set({ visible: !m.visible }).where(eq(schema.menuItems.id, id));
  }
  revalidatePath("/", "layout"); revalidatePath("/admin/site");
}

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  for (const k of ["siteName", "tagline", "heroTitle", "heroSubtitle"]) {
    const v = s(fd, k); if (!v) continue;
    await db.insert(schema.settings).values({ key: k, value: v }).onConflictDoUpdate({ target: schema.settings.key, set: { value: v } });
  }
  const auto = fd.get("botAutoPublish") === "on" ? "true" : "false";
  await db.insert(schema.settings).values({ key: "botAutoPublish", value: auto }).onConflictDoUpdate({ target: schema.settings.key, set: { value: auto } });
  revalidatePath("/", "layout"); back("/admin/site");
}

// ---------- Jobs
export async function saveJob(fd: FormData) {
  const admin = await requireAdmin();
  const title = s(fd, "title"), description = s(fd, "description"), apply = s(fd, "applyUrl");
  if (title.length < 3 || description.length < 10) return back("/admin/jobs", "Title and description are required.");
  if (apply && !isHttpUrl(apply) && !apply.includes("@")) return back("/admin/jobs", "Apply link must be a https:// URL or an email address.");
  await db.insert(schema.jobs).values({ title, description, company: s(fd, "company") || null, location: s(fd, "location") || null, applyUrl: apply || null, postedById: admin.id });
  revalidatePath("/opportunities"); back("/admin/jobs");
}

export async function deleteJob(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.jobs).where(eq(schema.jobs.id, s(fd, "id")));
  revalidatePath("/opportunities"); revalidatePath("/admin/jobs");
}

// ---------- Ad plans + ads (admin can post an ad on behalf of a member)
export async function saveAdPlan(fd: FormData) {
  await requireAdmin();
  const price = parseFloat(s(fd, "price")), days = parseInt(s(fd, "days"), 10);
  const placement = s(fd, "placement");
  if (!s(fd, "name") || !(price >= 0) || !(days > 0) || !["FORUM_TOP", "FORUM_SIDEBAR", "FORUM_INLINE"].includes(placement)) return back("/admin/ads", "Check the plan details.");
  await db.insert(schema.adPlans).values({ name: s(fd, "name"), priceMinor: Math.round(price * 100), durationDays: days, placement });
  back("/admin/ads");
}

export async function toggleAdPlan(fd: FormData) {
  await requireAdmin();
  const p = await db.query.adPlans.findFirst({ where: eq(schema.adPlans.id, s(fd, "id")) });
  if (p) await db.update(schema.adPlans).set({ active: !p.active }).where(eq(schema.adPlans.id, p.id));
  revalidatePath("/admin/ads");
}

export async function postAdForMember(fd: FormData) {
  await requireAdmin();
  const plan = await db.query.adPlans.findFirst({ where: eq(schema.adPlans.id, s(fd, "planId")) });
  const link = s(fd, "linkUrl"), title = s(fd, "title");
  if (!plan || title.length < 3 || !isHttpUrl(link)) return back("/admin/ads", "Choose a plan, a title and a valid https:// link.");
  const email = s(fd, "memberEmail").toLowerCase();
  const member = email ? await db.query.users.findFirst({ where: eq(schema.users.email, email) }) : null;
  if (email && !member) return back("/admin/ads", "No member has that email.");
  let img: string | null = null;
  try { img = await saveImage(fd.get("image") as File | null, "ads"); } catch (e) { return back("/admin/ads", (e as Error).message); }
  const startsAt = new Date();
  await db.insert(schema.ads).values({
    title, body: s(fd, "body") || null, imageUrl: img, linkUrl: link, planId: plan.id, userId: member?.id ?? null,
    status: "ACTIVE", startsAt, endsAt: new Date(startsAt.getTime() + plan.durationDays * 86400_000),
  });
  revalidatePath("/admin/ads"); back("/admin/ads");
}

export async function setAdStatus(fd: FormData) {
  await requireAdmin();
  const status = s(fd, "status") === "ACTIVE" ? "ACTIVE" : "EXPIRED";
  await db.update(schema.ads).set({ status }).where(eq(schema.ads.id, s(fd, "id")));
  revalidatePath("/admin/ads");
}

// ---------- Bot controls
export async function runBot(fd: FormData) {
  await requireAdmin();
  const task = s(fd, "task");
  try {
    if (task === "article") await generateArticle();
    else if (task === "question") await seedQuestion();
    else if (task === "answer") await answerOpenTopics(5);
    else await runDaily();
  } catch { /* the failure is recorded in the run log shown on the page */ }
  revalidatePath("/admin/bot"); revalidatePath("/blog");
}
