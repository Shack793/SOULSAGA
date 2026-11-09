"use client";

import { useEffect, useRef, useState } from "react";

type PdfDoc = import("pdfjs-dist").PDFDocumentProxy;

/**
 * Renders a PDF page-by-page onto canvases, lazily as pages scroll into view.
 * Works on iOS Safari, where an <iframe>/<embed> PDF only shows the first page.
 */
export default function PdfReader({ src, title }: { src: string; title: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
        const d = await pdfjs.getDocument({ url: src, withCredentials: true }).promise;
        if (!cancelled) setDoc(d);
      } catch {
        if (!cancelled) setError("We couldn't open this book. Check your connection and try again.");
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.clientWidth)));
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => ro.disconnect();
  }, []);

  if (error) return <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-red-200">{error}</p>;

  return (
    <div ref={wrap} className="mx-auto w-full max-w-3xl" aria-label={title}>
      {!doc && <p className="py-20 text-center text-white/50">Opening book…</p>}
      {doc && width > 0 && Array.from({ length: doc.numPages }, (_, i) => (
        <Page key={`${i}-${width}`} doc={doc} num={i + 1} width={width} />
      ))}
    </div>
  );
}

function Page({ doc, num, width }: { doc: PdfDoc; num: number; width: number }) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [h, setH] = useState(Math.round(width * 1.4));
  const done = useRef(false);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || done.current) return;
        done.current = true;
        const page = await doc.getPage(num);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const vp = page.getViewport({ scale: scale * Math.min(window.devicePixelRatio || 1, 2) });
        const c = canvas.current;
        if (!c) return;
        c.width = vp.width;
        c.height = vp.height;
        c.style.width = `${width}px`;
        c.style.height = `${Math.round(vp.height / Math.min(window.devicePixelRatio || 1, 2))}px`;
        setH(Math.round(base.height * scale));
        await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
      },
      { rootMargin: "800px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [doc, num, width]);

  return (
    <div ref={holder} style={{ minHeight: h }} className="mb-3 overflow-hidden rounded-lg bg-white shadow-lg">
      <canvas ref={canvas} className="block" />
    </div>
  );
}
