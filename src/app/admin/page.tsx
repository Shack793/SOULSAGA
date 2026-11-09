import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
export const metadata = { title: "Admin" };
export default async function Admin() {
  const u = await getUser();
  if (!u || u.role !== "ADMIN") redirect("/login?next=/admin");
  return <div className="container-x py-16"><h1 className="font-display text-4xl font-semibold">Admin panel</h1><p className="mt-3 text-white/60">Coming next.</p></div>;
}
