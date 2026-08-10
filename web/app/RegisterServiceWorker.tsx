"use client";

import { useEffect } from "react";

export default function RegisterServiceWorker() {
  useEffect(() => {
    // En dev, le service worker sert des assets en cache et masque les changements
    // (HMR/CSS). On ne l'enregistre donc qu'en production.
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);

  return null;
}
