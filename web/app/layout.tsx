import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";

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
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
