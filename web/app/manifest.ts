import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KOTÉ MORIS · Annuaire de l'île Maurice",
    short_name: "KOTÉ MORIS",
    description:
      "KOTÉ MORIS, tout trouver facilement : activités, restaurants et adresses utiles à Île Maurice.",
    start_url: "/",
    display: "standalone",
    background_color: "#e9e6dc",
    theme_color: "#0d7a72",
    lang: "fr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
