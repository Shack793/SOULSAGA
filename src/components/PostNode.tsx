import { Bot, ThumbsDown, ThumbsUp } from "lucide-react";
import { react } from "@/app/actions/forum";
import { timeAgo } from "@/lib/utils";
import ReplyForm from "./ReplyForm";

export type PostRow = {
  id: string; parentId: string | null; title: string | null; body: string; isAi: boolean;
  personaName: string | null; authorName: string | null; likes: number; dislikes: number; createdAt: Date;
};

const MAX_DEPTH = 4;

export default function PostNode({
  post, byParent, rootId, path, canReply, depth = 0,
}: {
  post: PostRow; byParent: Map<string, PostRow[]>; rootId: string; path: string; canReply: boolean; depth?: number;
}) {
  const kids = byParent.get(post.id) ?? [];
  const name = post.isAi ? post.personaName : post.authorName;

  return (
    <div className={depth ? "mt-3 border-l border-white/10 pl-3 sm:pl-5" : ""}>
      <article className={depth ? "" : "card3d p-5"}>
        <header className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">{name || "Member"}</span>
          {post.isAi && (
            <span title="This account is an AI assistant that answers from the books on this site" className="inline-flex items-center gap-1 rounded-full bg-saga-500/20 px-2 py-0.5 text-[11px] text-saga-400">
              <Bot size={11} /> AI
            </span>
          )}
          <span className="text-white/40">{timeAgo(post.createdAt)}</span>
        </header>
        <p className="mt-2 whitespace-pre-wrap break-words text-white/85">{post.body}</p>

        <div className="mt-3 flex items-center gap-1">
          {[{ v: 1, I: ThumbsUp, n: post.likes, l: "Like" }, { v: -1, I: ThumbsDown, n: post.dislikes, l: "Dislike" }].map(({ v, I, n, l }) => (
            <form key={v} action={react}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="value" value={v} />
              <input type="hidden" name="path" value={path} />
              <button aria-label={l} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
                <I size={15} /> {n}
              </button>
            </form>
          ))}
          {canReply && (
            <details className="ml-1 w-full flex-1">
              <summary className="inline-flex min-h-[36px] cursor-pointer list-none items-center rounded-lg px-2.5 text-sm text-white/60 hover:bg-white/10 hover:text-white">Reply</summary>
              <div className="mt-2"><ReplyForm parentId={post.id} rootId={rootId} /></div>
            </details>
          )}
        </div>
      </article>

      {kids.length > 0 && depth < MAX_DEPTH &&
        kids.map((k) => <PostNode key={k.id} post={k} byParent={byParent} rootId={rootId} path={path} canReply={canReply} depth={depth + 1} />)}
      {kids.length > 0 && depth >= MAX_DEPTH && <p className="mt-2 text-xs text-white/40">{kids.length} more repl{kids.length === 1 ? "y" : "ies"} in this branch</p>}
    </div>
  );
}
