import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Books & Courses" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await getUser();
  if (!u || u.role !== "ADMIN") redirect("/login?next=/admin");
  return (
    <div className="container-x py-8">
      <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="btn-ghost !min-h-[38px] whitespace-nowrap">{l.label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
