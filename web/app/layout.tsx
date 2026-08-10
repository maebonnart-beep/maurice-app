import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";

// Police du design system, auto-hébergée par next/font. Exposée en variable CSS
// (--font-plus-jakarta) consommée par --font-sans dans globals.css.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maurice+ · Activités",
  description: "Maurice+, tout trouver facilement : activités, restaurants et adresses utiles à Île Maurice.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Maurice+",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e8b84",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${plusJakarta.variable}`}>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
