import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { Bot, MessageCircle, ThumbsUp } from "lucide-react";
import { db, schema } from "@/db";
import { getUser } from "@/lib/auth";
import { timeAgo } from "@/lib/utils";
import NewTopicForm from "@/components/NewTopicForm";
import AdSlot from "@/components/AdSlot";

export const dynamic = "force-dynamic";
const PER_PAGE = 20;

export async function generateMetadata({ params }: { params: { room: string } }) {
  const r = await db.query.rooms.findFirst({ where: eq(schema.rooms.slug, params.room) });
  return r ? { title: r.name, description: r.description ?? undefined } : {};
}

export default async function Room({ params, searchParams }: { params: { room: string }; searchParams: { page?: string } }) {
  const room = await db.query.rooms.findFirst({ where: eq(schema.rooms.slug, params.room) });
  if (!room) notFound();
  const user = await getUser();
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);

  const topics = await db
    .select({
      id: schema.forumPosts.id, title: schema.forumPosts.title, body: schema.forumPosts.body, isAi: schema.forumPosts.isAi,
      personaName: schema.forumPosts.personaName, authorName: schema.users.name, likes: schema.forumPosts.likes,
      createdAt: schema.forumPosts.createdAt,
      replies: sql<number>`(select count(*) from forum_posts r where r.parent_id = ${schema.forumPosts.id})`,
    })
    .from(schema.forumPosts)
    .leftJoin(schema.users, eq(schema.forumPosts.userId, schema.users.id))
    .where(and(eq(schema.forumPosts.roomId, room.id), isNull(schema.forumPosts.parentId)))
    .orderBy(desc(schema.forumPosts.createdAt))
    .limit(PER_PAGE + 1)
    .offset((page - 1) * PER_PAGE);
  const more = topics.length > PER_PAGE;
  const shown = topics.slice(0, PER_PAGE);

  return (
    <div className="container-x py-10">
      <Link href="/forum" className="text-sm text-saga-400">← All rooms</Link>
      <h1 className="mt-2 font-display text-4xl font-semibold">{room.icon} {room.name}</h1>
      <p className="mt-1 text-white/60">{room.description}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {user ? (
            <NewTopicForm room={room.slug} />
          ) : (
            <div className="card3d p-5 text-white/70"><Link className="text-saga-400 underline" href={`/login?next=/forum/${room.slug}`}>Log in</Link> or <Link className="text-saga-400 underline" href="/register">join free</Link> to ask a question.</div>
          )}

          {shown.length === 0 && <p className="py-8 text-center text-white/50">No topics yet. Be the first to ask something.</p>}
          {shown.map((t, i) => (
            <div key={t.id}>
              <Link href={`/forum/${room.slug}/${t.id}`} className="card3d block p-5">
                <h2 className="font-display text-lg font-semibold">{t.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-white/60">{t.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                  <span className="inline-flex items-center gap-1">
                    {t.isAi ? t.personaName : t.authorName}
                    {t.isAi && <span className="inline-flex items-center gap-0.5 rounded-full bg-saga-500/20 px-1.5 text-saga-400"><Bot size={10} /> AI</span>}
                  </span>
                  <span>{timeAgo(t.createdAt)}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {t.replies}</span>
                  <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {t.likes}</span>
                </div>
              </Link>
              {(i + 1) % 5 === 0 && <AdSlot placement="FORUM_INLINE" className="mt-4" />}
            </div>
          ))}

          <div className="flex justify-between pt-2">
            {page > 1 ? <Link className="btn-ghost" href={`/forum/${room.slug}?page=${page - 1}`}>← Newer</Link> : <span />}
            {more && <Link className="btn-ghost" href={`/forum/${room.slug}?page=${page + 1}`}>Older →</Link>}
          </div>
        </div>

        <aside className="space-y-4">
          <AdSlot placement="FORUM_SIDEBAR" />
        </aside>
      </div>
    </div>
  );
}
