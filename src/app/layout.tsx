import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BioHostel.com · Reserva hostels y subarriendos",
  description:
    "El booking verde: reservas por noche y subarriendos mensuales con IA que sincroniza Booking y Airbnb, perfiles sociales y planes para anfitriones.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
      <script suppressHydrationWarning id="theme-init" dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem("bio-theme")||"light"}catch(e){}` }} />
      {children}
    </body>
    </html>
  );
}
