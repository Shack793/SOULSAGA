import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { hashPassword } from "../lib/auth";
import { DEFAULT_MENU } from "../lib/site";

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@soulsaga.com";
  const password = process.env.ADMIN_PASSWORD || "change-me-now";

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!existing) {
    await db.insert(schema.users).values({
      email,
      name: "Admin",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    });
    console.log(`Admin created: ${email}`);
  }

  if ((await db.select().from(schema.menuItems)).length === 0) {
    await db.insert(schema.menuItems).values(DEFAULT_MENU.map((m, i) => ({ ...m, sort: i })));
  }

  if ((await db.select().from(schema.rooms)).length === 0) {
    await db.insert(schema.rooms).values([
      { slug: "general", name: "General Discussion", description: "Say hello and talk about anything.", icon: "💬", sort: 0 },
      { slug: "book-club", name: "Book Club", description: "Discuss chapters, ideas and takeaways.", icon: "📚", sort: 1 },
      { slug: "growth", name: "Personal Growth", description: "Habits, mindset and healing.", icon: "🌱", sort: 2 },
      { slug: "money-career", name: "Money & Career", description: "Work, income and building things.", icon: "💼", sort: 3 },
    ]);
  }

  if ((await db.select().from(schema.adPlans)).length === 0) {
    await db.insert(schema.adPlans).values([
      { name: "Forum Sidebar – 7 days", priceMinor: 5000, durationDays: 7, placement: "FORUM_SIDEBAR" },
      { name: "Forum Inline – 30 days", priceMinor: 15000, durationDays: 30, placement: "FORUM_INLINE" },
      { name: "Forum Top Banner – 30 days", priceMinor: 30000, durationDays: 30, placement: "FORUM_TOP" },
    ]);
  }

  if ((await db.select().from(schema.personas)).length === 0) {
    const names = [
      "Ama K.", "Kwesi M.", "Efua A.", "Yaw Boateng", "Akosua P.", "Kofi D.", "Naana O.", "Selorm T.",
      "Abena S.", "Kojo B.", "Adwoa N.", "Nii Armah", "Esi Mensah", "Fiifi Q.", "Lydia O.", "Daniel A.",
      "Mariam I.", "Joseph K.", "Grace E.", "Samuel Y.",
    ];
    await db.insert(schema.personas).values(names.map((name) => ({ name })));
  }

  console.log("Seed complete.");
}

main();
