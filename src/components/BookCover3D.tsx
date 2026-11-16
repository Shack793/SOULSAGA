"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  coverUrl?: string | null;
  title: string;
  author?: string | null;
  kind?: string | null;
  className?: string;
};

/** A CSS 3D book that tilts toward the pointer and floats gently. */
export default function BookCover3D({ coverUrl, title, author, kind, className }: Props) {
  const book = useRef<HTMLDivElement>(null);

  const tilt = (e: React.MouseEvent) => {
    const el = book.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * 28 - 16).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 18 + 4).toFixed(2)}deg`);
  };

  const reset = () => {
    book.current?.style.setProperty("--ry", "-16deg");
    book.current?.style.setProperty("--rx", "4deg");
  };

  return (
    <div className={cn("book3d-scene", className)}>
      <div ref={book} className="book3d" onMouseMove={tilt} onMouseLeave={reset}>
        <span className="book3d-back" aria-hidden />
        <span className="book3d-pages" aria-hidden />
        <div className="book3d-cover">
          {coverUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={coverUrl} alt={`${title} cover`} />
          ) : (
            <div className="book3d-fallback">
              <span>{kind || "Ebook"}</span>
              <strong>{title}</strong>
              {author && <em>{author}</em>}
            </div>
          )}
          <span className="book3d-gloss" aria-hidden />
          <span className="book3d-spine" aria-hidden />
          {kind && <span className="book3d-badge">{kind}</span>}
        </div>
      </div>
    </div>
  );
}
