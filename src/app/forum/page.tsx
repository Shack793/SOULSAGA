import Link from "next/link";
import { asc, count, eq, isNull, and } from "drizzle-orm";
import { MessagesSquare } from "lucide-react";
import { db, schema } from "@/db";
import AdSlot from "@/components/AdSlot";

export const metadata = { title: "Forum", description: "Join chat rooms, ask questions and share answers with the community." };
export const dynamic = "force-dynamic";

export default async function Forum() {
  const rooms = await db.select().from(schema.rooms).orderBy(asc(schema.rooms.sort));
  const counts = await db
    .select({ roomId: schema.forumPosts.roomId, n: count() })
    .from(schema.forumPosts)
    .where(isNull(schema.forumPosts.parentId))
    .groupBy(schema.forumPosts.roomId);
  const byRoom = new Map(counts.map((c) => [c.roomId, c.n]));

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-4xl font-semibold">Forum</h1>
      <p className="mt-2 text-white/60">Pick a room, ask a question, or jump into a conversation.</p>

      <AdSlot placement="FORUM_TOP" className="mt-6" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {rooms.map((r) => (
          <Link key={r.id} href={`/forum/${r.slug}`} className="card3d flex items-start gap-4 p-5">
            <span className="text-3xl">{r.icon || <MessagesSquare />}</span>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold">{r.name}</h2>
              <p className="mt-1 text-sm text-white/60">{r.description}</p>
              <p className="mt-2 text-xs text-saga-400">{byRoom.get(r.id) ?? 0} topics</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
