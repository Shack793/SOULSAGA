/**
 * Tiny markdown → HTML renderer. All text is HTML-escaped FIRST, then a small set of
 * markdown patterns is turned into tags, so article bodies (including AI-written ones) can't inject HTML/JS.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const safeUrl = (u: string) => (/^(https?:\/\/|\/(?!\/))/i.test(u.trim()) ? u.trim() : "#");

function inline(s: string) {
  let t = esc(s);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" class="my-4 w-full rounded-xl" />`);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, url) => `<a href="${safeUrl(url)}" rel="noopener">${text}</a>`);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  return t;
}

export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if (!line.trim()) { flushPara(); closeList(); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); closeList();
      const lvl = Math.min(Math.max(m[1].length, 2), 3); // article title is the page <h1>
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
      flushPara(); if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) {
      flushPara(); if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      flushPara(); closeList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if (/^---+$/.test(line.trim())) {
      flushPara(); closeList(); out.push("<hr />");
    } else {
      closeList(); para.push(line.trim());
    }
  }
  flushPara(); closeList();
  return out.join("\n");
}

export const readingMinutes = (md: string) => Math.max(1, Math.round(md.split(/\s+/).length / 220));
