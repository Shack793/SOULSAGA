import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

// ---------- Users ----------
export const users = sqliteTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("MEMBER"), // MEMBER | ADMIN
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: createdAt(),
});

// ---------- Store ----------
export const products = sqliteTable("products", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  author: text("author"),
  kind: text("kind").notNull().default("BOOK"), // BOOK | COURSE
  description: text("description").notNull(),
  coverUrl: text("cover_url"),
  priceMinor: integer("price_minor").notNull().default(0), // pesewas (GHS * 100)
  currency: text("currency").notNull().default("GHS"),
  pdfPath: text("pdf_path"), // file name under uploads/books
  pdfText: text("pdf_text"), // extracted text, read by the AI
  toc: text("toc"), // newline-separated table of contents
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(false), // admin selects books the bot may use
  createdAt: createdAt(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id),
    productId: text("product_id").notNull().references(() => products.id),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull().default("GHS"),
    status: text("status").notNull().default("PENDING"), // PENDING | PAID | FAILED
    channel: text("channel"), // card | mobile_money
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => ({ byUserProduct: index("orders_user_product").on(t.userId, t.productId) })
);

// ---------- Blog ----------
export const articles = sqliteTable("articles", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(), // markdown
  coverUrl: text("cover_url"),
  metaTitle: text("meta_title"),
  metaDesc: text("meta_desc"),
  keywords: text("keywords"),
  problem: text("problem"), // the clear problem the article solves
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  productId: text("product_id").references(() => products.id),
  tocItem: text("toc_item"), // which book chapter this article came from (avoids repeats)
  sharedFb: integer("shared_fb", { mode: "boolean" }).notNull().default(false),
  sharedIg: integer("shared_ig", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: createdAt(),
});

export const testimonials = sqliteTable("testimonials", {
  id: id(),
  productId: text("product_id").notNull().references(() => products.id),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  rating: integer("rating").notNull().default(5),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

// ---------- Forum ----------
export const rooms = sqliteTable("rooms", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  sort: integer("sort").notNull().default(0),
  createdAt: createdAt(),
});

export const forumPosts = sqliteTable(
  "forum_posts",
  {
    id: id(),
    roomId: text("room_id").notNull().references(() => rooms.id),
    parentId: text("parent_id"), // null = question/topic, set = reply
    userId: text("user_id").references(() => users.id), // null when authored by an AI persona
    personaName: text("persona_name"), // unique display name for AI bot posts
    title: text("title"), // only for top-level topics
    body: text("body").notNull(),
    isAi: integer("is_ai", { mode: "boolean" }).notNull().default(false),
    productId: text("product_id").references(() => products.id), // book the AI based the post on
    likes: integer("likes").notNull().default(0),
    dislikes: integer("dislikes").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => ({ byRoom: index("posts_room_parent").on(t.roomId, t.parentId, t.createdAt) })
);

export const reactions = sqliteTable(
  "reactions",
  {
    id: id(),
    postId: text("post_id").notNull().references(() => forumPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    value: integer("value").notNull(), // 1 = like, -1 = dislike
    createdAt: createdAt(),
  },
  (t) => ({ one: uniqueIndex("reactions_post_user").on(t.postId, t.userId) })
);

// ---------- Ads / Jobs ----------
export const adPlans = sqliteTable("ad_plans", {
  id: id(),
  name: text("name").notNull(),
  priceMinor: integer("price_minor").notNull(),
  currency: text("currency").notNull().default("GHS"),
  durationDays: integer("duration_days").notNull(),
  placement: text("placement").notNull(), // FORUM_TOP | FORUM_SIDEBAR | FORUM_INLINE | HOME_BANNER
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const ads = sqliteTable("ads", {
  id: id(),
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url").notNull(),
  planId: text("plan_id").notNull().references(() => adPlans.id),
  userId: text("user_id").references(() => users.id), // member who bought it, or the member an admin posted for
  status: text("status").notNull().default("PENDING"), // PENDING | ACTIVE | EXPIRED
  startsAt: integer("starts_at", { mode: "timestamp" }),
  endsAt: integer("ends_at", { mode: "timestamp" }),
  clicks: integer("clicks").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  paymentRef: text("payment_ref"),
  createdAt: createdAt(),
});

export const jobs = sqliteTable("jobs", {
  id: id(),
  title: text("title").notNull(),
  company: text("company"),
  location: text("location"),
  description: text("description").notNull(),
  applyUrl: text("apply_url"),
  postedById: text("posted_by_id").references(() => users.id),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

// ---------- Site customisation ----------
export const menuItems = sqliteTable("menu_items", {
  id: id(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  sort: integer("sort").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
});

export const slides = sqliteTable("slides", {
  id: id(),
  title: text("title"),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  sort: integer("sort").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------- Analytics ----------
export const viewEvents = sqliteTable(
  "view_events",
  {
    id: id(),
    kind: text("kind").notNull(), // ARTICLE | PRODUCT | ROOM | POST
    refId: text("ref_id"),
    path: text("path").notNull(),
    createdAt: createdAt(),
  },
  (t) => ({ byKind: index("views_kind_time").on(t.kind, t.createdAt) })
);

// ---------- AI bot ----------
export const personas = sqliteTable("personas", {
  id: id(),
  name: text("name").notNull().unique(),
  tone: text("tone"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const botRuns = sqliteTable("bot_runs", {
  id: id(),
  task: text("task").notNull(), // ARTICLE | QUESTION | ANSWER | TESTIMONIAL | SHARE
  status: text("status").notNull(), // OK | ERROR
  detail: text("detail"),
  createdAt: createdAt(),
});
