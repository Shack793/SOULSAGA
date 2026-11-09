import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false } };

const LINKS = [
  ["/admin", "Overview"], ["/admin/products", "Books & Courses"], ["/admin/articles", "Articles"], ["/admin/bot", "AI Bot"],
  ["/admin/slides", "Slider"], ["/admin/site", "Site & Menu"], ["/admin/ads", "Ads"], ["/admin/jobs", "Jobs"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await getUser();
  if (!u || u.role !== "ADMIN") redirect("/login?next=/admin");
  return (
    <div className="container-x py-8">
      <nav className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {LINKS.map(([href, label]) => <Link key={href} href={href} className="btn-ghost !min-h-[38px] whitespace-nowrap">{label}</Link>)}
        <Link href="/forum" className="btn-ghost !min-h-[38px] whitespace-nowrap">Forum ↗</Link>
      </nav>
      {children}
    </div>
  );
}
