import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Autorise l'accès au dev server depuis un téléphone sur le même Wi-Fi
  // (via l'IP locale du PC) — sans ça, Next.js bloque les requêtes JS
  // cross-origin en dev et la page reste figée (rien n'est cliquable).
  allowedDevOrigins: ["192.168.100.25"],
};

export default nextConfig;
