/**
 * Posts to your own Facebook Page and Instagram Business account through the Meta Graph API.
 * Needs META_PAGE_ID + META_PAGE_ACCESS_TOKEN (and META_IG_USER_ID for Instagram).
 * Instagram requires a publicly reachable JPEG/PNG image URL, so the site must be live on a public domain.
 */
const GRAPH = "https://graph.facebook.com/v21.0";

export const facebookConfigured = () => !!(process.env.META_PAGE_ID && process.env.META_PAGE_ACCESS_TOKEN);
export const instagramConfigured = () => !!(process.env.META_IG_USER_ID && process.env.META_PAGE_ACCESS_TOKEN);

async function graph(path: string, params: Record<string, string>) {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, access_token: process.env.META_PAGE_ACCESS_TOKEN! }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`Meta API: ${json?.error?.message || res.status}`);
  return json as { id: string };
}

export async function shareToFacebook(args: { message: string; link: string; imageUrl?: string }) {
  if (!facebookConfigured()) throw new Error("Facebook is not configured (META_PAGE_ID / META_PAGE_ACCESS_TOKEN)");
  const page = process.env.META_PAGE_ID!;
  // A link post makes Facebook build a preview card from the article's Open Graph tags.
  return graph(`/${page}/feed`, { message: args.message, link: args.link });
}

export async function shareToInstagram(args: { caption: string; imageUrl: string }) {
  if (!instagramConfigured()) throw new Error("Instagram is not configured (META_IG_USER_ID)");
  if (!/^https:\/\//.test(args.imageUrl)) throw new Error("Instagram needs a public https image URL");
  const ig = process.env.META_IG_USER_ID!;
  const container = await graph(`/${ig}/media`, { image_url: args.imageUrl, caption: args.caption });
  return graph(`/${ig}/media_publish`, { creation_id: container.id });
}
