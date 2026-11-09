/** Minimal Anthropic Messages API client (no SDK needed). AI_BASE_URL exists so tests can point at a local mock. */
const base = () => (process.env.AI_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");

export const aiConfigured = () => !!process.env.ANTHROPIC_API_KEY;

export async function generateText(opts: { system: string; user: string; maxTokens?: number }): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const res = await fetch(`${base()}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5-5",
      max_tokens: opts.maxTokens ?? 4000,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${json?.error?.message || "unknown error"}`);
  const text = (json.content || []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
  if (!text.trim()) throw new Error("AI returned an empty response");
  return text.trim();
}

/** Asks for JSON and parses the first {...} block, tolerating code fences or stray prose around it. */
export async function generateJson<T>(opts: { system: string; user: string; maxTokens?: number }): Promise<T> {
  const text = await generateText({ ...opts, system: `${opts.system}\n\nReply with a single valid JSON object and nothing else.` });
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI did not return JSON");
  return JSON.parse(text.slice(start, end + 1)) as T;
}

/**
 * Picks the passages of a book most relevant to a topic (keyword overlap), returned in original order.
 * Keeps prompts small and keeps the AI grounded in the book rather than in general knowledge.
 */
export function pickContext(text: string, query: string, maxChars = 7000): string {
  const words = Array.from(new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3)));
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  if (!paras.length) return text.slice(0, maxChars);
  const scored = paras.map((p, i) => {
    const lower = p.toLowerCase();
    return { i, p, s: words.reduce((n, w) => n + (lower.includes(w) ? 1 : 0), 0) };
  });
  const best = [...scored].sort((a, b) => b.s - a.s || a.i - b.i);
  const chosen: typeof scored = [];
  let size = 0;
  for (const c of best) {
    if (c.s === 0 && chosen.length > 0) break;
    if (size + c.p.length > maxChars) continue;
    chosen.push(c);
    size += c.p.length;
  }
  if (!chosen.length) return text.slice(0, maxChars);
  return chosen.sort((a, b) => a.i - b.i).map((c) => c.p).join("\n\n");
}
