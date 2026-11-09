import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const DEFAULT_MENU = [
  { label: "Blog", href: "/blog" },
  { label: "Forum", href: "/forum" },
  { label: "Books & Courses", href: "/store" },
  { label: "Opportunities", href: "/opportunities" },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "SoulSaga",
  tagline: "Books, courses and a community for the journey inward.",
  accent: "#8b5cf6",
  heroTitle: "Read. Learn. Belong.",
  heroSubtitle: "Digital books and courses, daily articles, and a living forum community.",
};

export async function getSettings() {
  const rows = await db.select().from(schema.settings);
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export async function getMenu() {
  const rows = await db
    .select()
    .from(schema.menuItems)
    .where(eq(schema.menuItems.visible, true))
    .orderBy(asc(schema.menuItems.sort));
  return rows.length ? rows.map((r) => ({ label: r.label, href: r.href })) : DEFAULT_MENU;
}
