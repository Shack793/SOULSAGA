"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";

export type PostState = { error?: string } | undefined;

/** Max posts per member per minute, to stop floods. */
async function tooFast(userId: string) {
  const since = new Date(Date.now() - 60_000);
  const [r] = await db.select({ n: count() }).from(schema.forumPosts).where(and(eq(schema.forumPosts.userId, userId), gt(schema.forumPosts.createdAt, since)));
  return r.n >= 5;
}

export async function createTopic(_: PostState, fd: FormData): Promise<PostState> {
  const user = await getUser();
  if (!user) return { error: "Please log in to post." };
  const room = await db.query.rooms.findFirst({ where: eq(schema.rooms.slug, String(fd.get("room"))) });
  if (!room) return { error: "Room not found." };
  const title = String(fd.get("title") || "").trim();
  const body = String(fd.get("body") || "").trim();
  if (title.length < 5 || title.length > 150) return { error: "Title must be 5–150 characters." };
  if (body.length < 10 || body.length > 5000) return { error: "Details must be 10–5000 characters." };
  if (await tooFast(user.id)) return { error: "You're posting too fast. Please wait a minute." };

  const [post] = await db.insert(schema.forumPosts).values({ roomId: room.id, userId: user.id, title, body }).returning();
  revalidatePath(`/forum/${room.slug}`);
  redirect(`/forum/${room.slug}/${post.id}`);
}

export async function createReply(_: PostState, fd: FormData): Promise<PostState> {
  const user = await getUser();
  if (!user) return { error: "Please log in to reply." };
  const parent = await db.query.forumPosts.findFirst({ where: eq(schema.forumPosts.id, String(fd.get("parentId"))) });
  if (!parent) return { error: "That post no longer exists." };
  const body = String(fd.get("body") || "").trim();
  if (body.length < 2 || body.length > 3000) return { error: "Reply must be 2–3000 characters." };
  if (await tooFast(user.id)) return { error: "You're posting too fast. Please wait a minute." };

  await db.insert(schema.forumPosts).values({ roomId: parent.roomId, parentId: parent.id, userId: user.id, body });
  const room = await db.query.rooms.findFirst({ where: eq(schema.rooms.id, parent.roomId) });
  const rootId = String(fd.get("rootId") || parent.id);
  revalidatePath(`/forum/${room?.slug}/${rootId}`);
  return undefined;
}

/** value: 1 = like, -1 = dislike. Clicking the same button again removes the reaction. */
export async function react(fd: FormData) {
  const user = await getUser();
  const postId = String(fd.get("postId"));
  const path = String(fd.get("path") || "/forum");
  if (!user) redirect(`/login?next=${encodeURIComponent(path)}`);
  const value = Number(fd.get("value")) === -1 ? -1 : 1;

  db.transaction((tx) => {
    const existing = tx.select().from(schema.reactions).where(and(eq(schema.reactions.postId, postId), eq(schema.reactions.userId, user.id))).get();
    if (existing && existing.value === value) tx.delete(schema.reactions).where(eq(schema.reactions.id, existing.id)).run();
    else if (existing) tx.update(schema.reactions).set({ value }).where(eq(schema.reactions.id, existing.id)).run();
    else tx.insert(schema.reactions).values({ postId, userId: user.id, value }).run();

    const likes = tx.select({ n: count() }).from(schema.reactions).where(and(eq(schema.reactions.postId, postId), eq(schema.reactions.value, 1))).get()!.n;
    const dislikes = tx.select({ n: count() }).from(schema.reactions).where(and(eq(schema.reactions.postId, postId), eq(schema.reactions.value, -1))).get()!.n;
    tx.update(schema.forumPosts).set({ likes, dislikes }).where(eq(schema.forumPosts.id, postId)).run();
  });
  revalidatePath(path);
}
