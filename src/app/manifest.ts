import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: process.env.NEXT_PUBLIC_SITE_NAME || "SoulSaga",
    short_name: "SoulSaga",
    description: "Books, courses, daily articles and a living community.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070510",
    theme_color: "#7c3aed",
    categories: ["books", "education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Forum", url: "/forum", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Blog", url: "/blog", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
