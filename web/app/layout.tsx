import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";

// Polices du design system, auto-hébergées par next/font. Exposées en variables CSS
// consommées par --font-sans / --font-serif dans globals.css.
// Plus Jakarta Sans : interface & texte courant. Fraunces (serif) : noms de lieux & titres.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KOTÉ MORIS · Activités",
  description: "KOTÉ MORIS, tout trouver facilement : activités, restaurants et adresses utiles à Île Maurice.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KOTÉ MORIS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d7a72",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${plusJakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
