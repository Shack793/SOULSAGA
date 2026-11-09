"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type SlideData = { id: string; title?: string | null; subtitle?: string | null; imageUrl: string; linkUrl?: string | null };

/**
 * Touch-friendly, scroll-snap slider. Every image is rendered with object-cover inside a
 * fixed responsive aspect ratio, so any uploaded size is cropped to fit on every device.
 */
export default function Slider({ slides, autoplayMs = 5000 }: { slides: SlideData[]; autoplayMs?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (n: number) => {
      const el = ref.current;
      if (!el || !slides.length) return;
      const next = (n + slides.length) % slides.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setI(next);
    },
    [slides.length]
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => go(i + 1), autoplayMs);
    return () => clearInterval(t);
  }, [i, paused, go, autoplayMs, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="card3d group relative overflow-hidden !p-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={ref}
        className="slider"
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {slides.map((s, idx) => {
          const inner = (
            <div className="relative aspect-[4/3] w-full sm:aspect-[16/7]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.imageUrl}
                alt={s.title || ""}
                className="absolute inset-0 h-full w-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
              {(s.title || s.subtitle) && (
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  {s.title && <h3 className="font-display text-2xl font-semibold sm:text-4xl">{s.title}</h3>}
                  {s.subtitle && <p className="mt-1 max-w-xl text-sm text-white/75 sm:text-base">{s.subtitle}</p>}
                </div>
              )}
            </div>
          );
          return s.linkUrl ? (
            <Link key={s.id} href={s.linkUrl} className="block">{inner}</Link>
          ) : (
            <div key={s.id}>{inner}</div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button aria-label="Previous slide" onClick={() => go(i - 1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur transition hover:bg-black/60 sm:block"><ChevronLeft /></button>
          <button aria-label="Next slide" onClick={() => go(i + 1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur transition hover:bg-black/60 sm:block"><ChevronRight /></button>
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {slides.map((_, d) => (
              <button key={d} aria-label={`Go to slide ${d + 1}`} onClick={() => go(d)} className={`h-2 rounded-full transition-all ${d === i ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
