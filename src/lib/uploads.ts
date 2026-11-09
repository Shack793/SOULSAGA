import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const IMG_EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" };
const MAX_IMG = 5 * 1024 * 1024;
const MAX_PDF = 50 * 1024 * 1024;

/** Saves an uploaded image under uploads/media/<folder> and returns its public URL, or null if none was sent. */
export async function saveImage(file: File | null, folder: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = IMG_EXT[file.type];
  if (!ext) throw new Error("Images must be JPG, PNG, WebP or GIF.");
  if (file.size > MAX_IMG) throw new Error("Image is too large (max 5 MB).");
  const name = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "uploads", "media", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/api/media/${folder}/${name}`;
}

/** Saves a PDF under uploads/books (never publicly served) and returns the stored file name plus the buffer. */
export async function savePdf(file: File | null): Promise<{ name: string; buffer: Buffer } | null> {
  if (!file || file.size === 0) return null;
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) throw new Error("Book file must be a PDF.");
  if (file.size > MAX_PDF) throw new Error("PDF is too large (max 50 MB).");
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString() !== "%PDF-") throw new Error("That file isn't a valid PDF.");
  const name = `${crypto.randomUUID()}.pdf`;
  const dir = path.join(process.cwd(), "uploads", "books");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buffer);
  return { name, buffer };
}

/** Extracts plain text so the AI can read the book. Returns "" for scanned/image-only PDFs. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const pdf = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const out = await pdf(buffer);
    return out.text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return "";
  }
}

/** Best-effort table of contents: picks up "Chapter N ..." / "Part N ..." lines when the admin leaves TOC blank. */
export function guessToc(text: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.length < 4 || line.length > 90) continue;
    if (/^(chapter|part|lesson|module|day|week)\s+([0-9]+|[ivxlc]+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(line)) {
      const k = line.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(line); }
    }
    if (out.length >= 40) break;
  }
  return out.join("\n");
}
