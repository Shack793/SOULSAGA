"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  siteName: string;
  menu: { label: string; href: string }[];
  user: { name: string; role: string } | null;
};

export default function Header({ siteName, menu, user }: Props) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  const link = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition",
      path.startsWith(href) ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
    );

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-semibold">
          <span className="orb inline-block h-7 w-7 rounded-full" />
          {siteName}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className={link(m.href)}>{m.label}</Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-ghost !min-h-[38px]">Admin</Link>}
              <Link href="/dashboard" className="btn-primary !min-h-[38px]">{user.name.split(" ")[0]}</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost !min-h-[38px]">Log in</Link>
              <Link href="/register" className="btn-primary !min-h-[38px]">Join free</Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="container-x animate-rise pb-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {menu.map((m) => (
              <Link key={m.href} href={m.href} onClick={() => setOpen(false)} className={cn(link(m.href), "!py-3 text-base")}>
                {m.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="btn-primary flex-1">Dashboard</Link>
                  {user.role === "ADMIN" && <Link href="/admin" onClick={() => setOpen(false)} className="btn-ghost flex-1">Admin</Link>}
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1">Log in</Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">Join free</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
