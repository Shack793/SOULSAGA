"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

const safeNext = (n: FormDataEntryValue | null) => {
  const s = String(n || "");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/dashboard";
};

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  const exists = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (exists) return { error: "An account with this email already exists." };

  const [u] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await hashPassword(password), role: "MEMBER" })
    .returning();
  await createSession({ id: u.id, email: u.email, name: u.name, role: "MEMBER" });
  redirect(safeNext(fd.get("next")));
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const u = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!u || !(await verifyPassword(password, u.passwordHash))) return { error: "Incorrect email or password." };
  await createSession({ id: u.id, email: u.email, name: u.name, role: u.role as "MEMBER" | "ADMIN" });
  redirect(u.role === "ADMIN" && !fd.get("next") ? "/admin" : safeNext(fd.get("next")));
}

export async function logout() {
  destroySession();
  redirect("/");
}
