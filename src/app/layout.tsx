import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import PwaClient from "@/components/PwaClient";
import { getMenu, getSettings } from "@/lib/site";
import { getUser } from "@/lib/auth";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${s.siteName} – ${s.tagline}`, template: `%s | ${s.siteName}` },
    description: s.tagline,
    applicationName: s.siteName,
    manifest: "/manifest.webmanifest",
    // iOS needs these explicitly: it ignores most of the web manifest.
    appleWebApp: { capable: true, title: s.siteName, statusBarStyle: "black-translucent" },
    icons: {
      icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: { type: "website", siteName: s.siteName, title: s.siteName, description: s.tagline },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, menu, user] = await Promise.all([getSettings(), getMenu(), getUser()]);
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Header siteName={settings.siteName} menu={menu} user={user ? { name: user.name, role: user.role } : null} />
        <main>{children}</main>
        <footer className="mt-24 border-t border-white/10 py-10 text-center text-sm text-white/50">
          <div className="container-x">© {new Date().getFullYear()} {settings.siteName}. {settings.tagline}</div>
        </footer>
        <PwaClient />
      </body>
    </html>
  );
}
