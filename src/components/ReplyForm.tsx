"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createReply, type PostState } from "@/app/actions/forum";

function Send() {
  const { pending } = useFormStatus();
  return <button className="btn-primary !min-h-[40px]" disabled={pending}>{pending ? "Posting…" : "Post reply"}</button>;
}

export default function ReplyForm({ parentId, rootId, placeholder = "Write a reply…" }: { parentId: string; rootId: string; placeholder?: string }) {
  const [state, action] = useFormState<PostState, FormData>(createReply, undefined);
  const form = useRef<HTMLFormElement>(null);
  const prev = useRef(state);

  // createReply returns undefined on success: clear the box once a submit completes without an error.
  useEffect(() => {
    if (state === undefined && prev.current !== undefined) form.current?.reset();
    prev.current = state;
  }, [state]);

  return (
    <form
      ref={form}
      action={async (fd) => {
        await action(fd);
        form.current?.reset();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="parentId" value={parentId} />
      <input type="hidden" name="rootId" value={rootId} />
      <textarea name="body" rows={3} className="input" placeholder={placeholder} required minLength={2} maxLength={3000} />
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      <Send />
    </form>
  );
}
