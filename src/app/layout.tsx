import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./globals.modern.css";
import "./landing.css";
import { store } from "@/lib/store";
import { DEFAULT_SITE_SETTINGS, siteThemeCss, type SiteSettings } from "@/lib/site-settings";
import { SiteSettingsProvider } from "./site-settings-context";

export const dynamic = "force-dynamic";

// Tipografías del manual de identidad: Montserrat en títulos, Playfair en énfasis editorial, Inter en texto y UI.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-montserrat", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-playfair", display: "swap" });

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
    <html lang="es" data-theme={settings.design.defaultTheme} className={`${inter.variable} ${montserrat.variable} ${playfair.variable}`} suppressHydrationWarning>
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
