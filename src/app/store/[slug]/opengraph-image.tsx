import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { db, schema } from "@/db";

export const runtime = "nodejs";
export const revalidate = 3600;
export const alt = "SoulSaga book cover";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function coverDataUrl(coverUrl: string | null) {
  if (!coverUrl?.startsWith("/api/media/")) return null;
  const file = path.normalize(path.join(process.cwd(), "uploads", "media", ...coverUrl.replace("/api/media/", "").split("/")));
  const type = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" }[
    path.extname(file).toLowerCase()
  ];
  try {
    return type ? `data:${type};base64,${fs.readFileSync(file).toString("base64")}` : null;
  } catch {
    return null;
  }
}

function fontFile(name: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "fonts", name));
}

export default async function Image({ params }: { params: { slug: string } }) {
  const p = await db.query.products.findFirst({ where: eq(schema.products.slug, params.slug) });
  const cover = p ? coverDataUrl(p.coverUrl) : null;
  const title = (p?.title || "SoulSaga").slice(0, 90);
  const author = p?.author || "";
  const description = (p?.description || "Books, courses and a community for the journey inward.")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const kind = (p?.kind || "BOOK").replace("BOOK", "Ebook").replace("COURSE", "Course");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          padding: 64,
          background: "linear-gradient(135deg, #0b0718 0%, #1b1238 45%, #2a1a5e 100%)",
          color: "#ffffff",
          fontFamily: "Noto Sans",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", left: -120, top: -140, width: 560, height: 560, borderRadius: 999, background: "radial-gradient(circle, rgba(139,92,246,0.5), rgba(139,92,246,0) 70%)", display: "flex" }} />
        <div style={{ position: "absolute", right: -160, bottom: -200, width: 640, height: 640, borderRadius: 999, background: "radial-gradient(circle, rgba(245,158,11,0.18), rgba(245,158,11,0) 70%)", display: "flex" }} />

        <div style={{ display: "flex", position: "relative", width: 312, height: 440, marginRight: 68, transform: "rotate(-2deg)" }}>
          <div style={{ display: "flex", position: "absolute", left: 20, top: 18, width: 292, height: 420, borderRadius: 14, background: "#08050f" }} />
          <div style={{ display: "flex", position: "absolute", right: 2, top: 12, width: 16, height: 412, borderRadius: 4, background: "#ece7f8" }} />
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 300,
              height: 420,
              borderRadius: 14,
              overflow: "hidden",
              background: "linear-gradient(145deg, #3b2a7a, #120d28)",
              boxShadow: "0 36px 80px -18px rgba(0,0,0,0.9), 24px 26px 70px -34px rgba(167,139,250,0.9)",
            }}
          >
            {cover ? (
              <img src={cover} width={300} height={420} style={{ objectFit: "cover" }} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", padding: "42px 24px 42px 58px" }}>
                <div style={{ display: "flex", fontSize: 14, letterSpacing: 5, color: "#c4b5fd", textTransform: "uppercase" }}>{kind}</div>
                <div style={{ display: "flex", marginTop: 20, fontSize: 36, lineHeight: 1.12, fontWeight: 700 }}>{title}</div>
                {author ? <div style={{ display: "flex", marginTop: 18, fontSize: 18, color: "rgba(255,255,255,0.65)" }}>{author}</div> : null}
              </div>
            )}
            <div style={{ display: "flex", position: "absolute", left: 0, top: 0, bottom: 0, width: 48, background: "linear-gradient(90deg, rgba(0,0,0,0.7), rgba(255,255,255,0.18) 45%, rgba(0,0,0,0.32))" }} />
            <div style={{ display: "flex", position: "absolute", top: 0, right: 0, bottom: 0, left: 0, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 14 }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", borderRadius: 999, border: "1px solid rgba(167,139,250,0.45)", background: "rgba(139,92,246,0.2)", padding: "7px 18px", fontSize: 15, letterSpacing: 4, textTransform: "uppercase", color: "#d8ccff" }}>
              {kind}
            </div>
            <div style={{ display: "flex", borderRadius: 999, background: "rgba(16,185,129,0.16)", padding: "7px 16px", fontSize: 15, color: "#a7f3d0" }}>
              Read online
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 26, fontSize: 56, lineHeight: 1.06, fontWeight: 700, letterSpacing: -1.2 }}>{title}</div>
          {author ? <div style={{ display: "flex", marginTop: 14, fontSize: 22, color: "rgba(255,255,255,0.62)" }}>by {author}</div> : null}
          <div style={{ display: "flex", marginTop: 22, fontSize: 21, lineHeight: 1.45, color: "rgba(255,255,255,0.8)" }}>{description}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: "auto", fontSize: 20, color: "rgba(255,255,255,0.55)" }}>
            <div style={{ display: "flex", width: 36, height: 36, borderRadius: 999, background: "radial-gradient(circle at 32% 26%, #ede9fe, #8b5cf6 42%, #2e1065 82%)" }} />
            <div style={{ display: "flex" }}>SoulSaga · books, courses &amp; community</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans", data: fontFile("NotoSans-Regular.ttf"), weight: 400, style: "normal" },
        { name: "Noto Sans", data: fontFile("NotoSans-Bold.ttf"), weight: 700, style: "normal" },
      ],
    }
  );
}
