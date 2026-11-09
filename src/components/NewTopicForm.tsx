"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createTopic, type PostState } from "@/app/actions/forum";

function Send() {
  const { pending } = useFormStatus();
  return <button className="btn-primary" disabled={pending}>{pending ? "Posting…" : "Post question"}</button>;
}

export default function NewTopicForm({ room }: { room: string }) {
  const [state, action] = useFormState<PostState, FormData>(createTopic, undefined);
  return (
    <form action={action} className="card3d space-y-3 p-5">
      <input type="hidden" name="room" value={room} />
      <div>
        <label className="label" htmlFor="title">Ask a question or start a topic</label>
        <input id="title" name="title" className="input" placeholder="What would you like to discuss?" required minLength={5} maxLength={150} />
      </div>
      <div>
        <label className="label" htmlFor="body">Details</label>
        <textarea id="body" name="body" rows={4} className="input" required minLength={10} maxLength={5000} />
      </div>
      {state?.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}
      <Send />
    </form>
  );
}
