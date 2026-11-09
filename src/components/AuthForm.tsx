"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { login, register, type FormState } from "@/app/actions/auth";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : label}</button>;
}

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action] = useFormState<FormState, FormData>(mode === "login" ? login : register, undefined);
  const isReg = mode === "register";

  return (
    <div className="container-x flex min-h-[70dvh] items-center justify-center py-12">
      <form action={action} className="card3d w-full max-w-md space-y-4 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold">{isReg ? "Create your account" : "Welcome back"}</h1>
        {next && <input type="hidden" name="next" value={next} />}
        {isReg && (
          <div>
            <label className="label" htmlFor="name">Name</label>
            <input id="name" name="name" className="input" autoComplete="name" required />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" autoComplete={isReg ? "new-password" : "current-password"} minLength={isReg ? 8 : undefined} required />
        </div>
        {state?.error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>}
        <Submit label={isReg ? "Create account" : "Log in"} />
        <p className="text-center text-sm text-white/60">
          {isReg ? "Already a member?" : "New here?"}{" "}
          <Link href={isReg ? "/login" : "/register"} className="text-saga-400 underline">{isReg ? "Log in" : "Join free"}</Link>
        </p>
      </form>
    </div>
  );
}
