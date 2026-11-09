export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "item";

export const formatMoney = (minor: number, currency = "GHS") =>
  minor === 0
    ? "Free"
    : new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(minor / 100);

export const timeAgo = (d: Date | number) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  const steps: [number, string][] = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [n, u] of steps) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
};

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Only http(s) links are allowed for ads/jobs/slides, which blocks javascript: and data: URLs. */
export const isHttpUrl = (s: string) => {
  try { return ["http:", "https:"].includes(new URL(s).protocol); } catch { return false; }
};
