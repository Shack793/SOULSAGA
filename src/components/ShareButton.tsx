"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Facebook, Linkedin, MessageCircle, Send, Share2, Twitter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const enc = encodeURIComponent;

type Props = { url: string; title: string; description: string; className?: string };

export default function ShareButton({ url, title, description, className }: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = description.length > 180 ? `${description.slice(0, 177)}…` : description;

  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} — ${url}`)}`, Icon: MessageCircle },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, Icon: Facebook },
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`, Icon: Twitter },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, Icon: Linkedin },
    { label: "Telegram", href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`, Icon: Send },
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return true;
      }
    }
    return false;
  }

  async function onShareClick() {
    if (!(await nativeShare())) setOpen(true);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <button type="button" onClick={onShareClick} className={cn("btn-ghost", className)} aria-haspopup="dialog" aria-expanded={open}>
        <Share2 size={16} /> Share
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <button type="button" aria-label="Close share dialog" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Share this book"
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-ink-900 p-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 px-1">
                <div>
                  <p className="font-display text-lg font-semibold">Share this book</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">The cover, title and description travel with the link.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 grid gap-1">
                {links.map(({ label, href, Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      window.open(href, "_blank", "noopener,noreferrer,width=640,height=640");
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    <Icon size={17} className="text-saga-300" /> {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={copyLink}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
              >
                {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} className="text-saga-300" />}
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
