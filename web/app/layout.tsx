import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Fraunces, Dancing_Script } from "next/font/google";
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

// Police cursive (manuscrite) réservée à la baseline « les adresses de Maurice ».
const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-script",
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
  // Sans ça, `env(safe-area-inset-*)` renvoie 0 sur iOS (Safari ne laisse le
  // contenu déborder sous les zones sûres — encoche/Dynamic Island en haut,
  // barre d'accueil en bas — que si le viewport le demande explicitement).
  // La barre de nav du bas s'appuyait déjà sur cet inset (paddingBottom) mais
  // il ne servait à rien : elle se retrouvait collée au bord, tronquée par la
  // zone du geste d'accueil sur les iPhone à Face ID (rapporté sur iPhone 17
  // Pro, mais concerne tous les iPhone sans encoche physique).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${plusJakarta.variable} ${fraunces.variable} ${dancingScript.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
