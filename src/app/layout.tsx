import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./globals.modern.css";
import "./landing.css";
import { store } from "@/lib/store";
import { DEFAULT_SITE_SETTINGS, siteThemeCss, type SiteSettings } from "@/lib/site-settings";
import { SiteSettingsProvider } from "./site-settings-context";

export const dynamic = "force-dynamic";

async function getSettings(): Promise<SiteSettings> {
  try {
    return await store.siteSettings();
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.seo.title,
    description: settings.seo.description,
    openGraph: {
      title: settings.seo.title,
      description: settings.seo.description,
      siteName: `${settings.brand.name}${settings.brand.suffix}`,
      ...(settings.seo.ogImage ? { images: [{ url: settings.seo.ogImage }] } : {}),
    },
    twitter: {
      card: settings.seo.ogImage ? "summary_large_image" : "summary",
      title: settings.seo.title,
      description: settings.seo.description,
      ...(settings.seo.ogImage ? { images: [settings.seo.ogImage] } : {}),
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const themeScript = `(function(){try{var t=localStorage.getItem("bio-theme");document.documentElement.dataset.theme=(t==="dark"||t==="light")?t:"${settings.design.defaultTheme}";}catch(e){document.documentElement.dataset.theme="${settings.design.defaultTheme}";}})();`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <style id="site-theme" dangerouslySetInnerHTML={{ __html: siteThemeCss(settings) }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <SiteSettingsProvider settings={settings}>{children}</SiteSettingsProvider>
      </body>
    </html>
  );
}
