import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maurice+ · Activités",
  description: "Tout ce qu'on peut faire à Grand Baie, Île Maurice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
