import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import PostNode, { type PostRow } from "@/components/PostNode";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";

const getRoot = async (room: string, id: string) => {
  const r = await db.query.rooms.findFirst({ where: eq(schema.rooms.slug, room) });
  if (!r) return null;
  const p = await db.query.forumPosts.findFirst({ where: and(eq(schema.forumPosts.id, id), eq(schema.forumPosts.roomId, r.id)) });
  return p && !p.parentId ? { room: r, post: p } : null;
};

export async function generateMetadata({ params }: { params: { room: string; postId: string } }) {
  const f = await getRoot(params.room, params.postId);
  return f ? { title: f.post.title ?? "Topic", description: f.post.body.slice(0, 155) } : {};
}

export default async function Thread({ params }: { params: { room: string; postId: string } }) {
  const found = await getRoot(params.room, params.postId);
  if (!found) notFound();
  const { room, post } = found;
  const user = await getUser();

  // Pull the whole room's replies once, then keep only this thread's descendants.
  const rows: PostRow[] = await db
    .select({
      id: schema.forumPosts.id, parentId: schema.forumPosts.parentId, title: schema.forumPosts.title, body: schema.forumPosts.body,
      isAi: schema.forumPosts.isAi, personaName: schema.forumPosts.personaName, authorName: schema.users.name,
      likes: schema.forumPosts.likes, dislikes: schema.forumPosts.dislikes, createdAt: schema.forumPosts.createdAt,
    })
    .from(schema.forumPosts)
    .leftJoin(schema.users, eq(schema.forumPosts.userId, schema.users.id))
    .where(eq(schema.forumPosts.roomId, room.id))
    .orderBy(asc(schema.forumPosts.createdAt));

  const byParent = new Map<string, PostRow[]>();
  for (const r of rows) if (r.parentId) byParent.set(r.parentId, [...(byParent.get(r.parentId) ?? []), r]);
  const root = rows.find((r) => r.id === post.id)!;
  const path = `/forum/${room.slug}/${post.id}`;

  return (
    <div className="container-x py-10">
      <Link href={`/forum/${room.slug}`} className="text-sm text-saga-400">← {room.name}</Link>
      <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{post.title}</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <PostNode post={root} byParent={byParent} rootId={post.id} path={path} canReply={!!user} />
          {!user && (
            <p className="mt-4 text-white/60"><Link className="text-saga-400 underline" href={`/login?next=${path}`}>Log in</Link> to reply, like or dislike.</p>
          )}
        </div>
        <aside><AdSlot placement="FORUM_SIDEBAR" /></aside>
      </div>
    </div>
  );
}
