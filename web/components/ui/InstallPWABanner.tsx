"use client";

import { useEffect, useState } from "react";
import { DownloadSimple, DotsThreeCircle, Export, X } from "@phosphor-icons/react";

const DISMISS_KEY = "km_install_banner_dismissed";
const SHOW_DELAY_MS = 4000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari expose ce flag hors standard plutôt que display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Bandeau d'installation PWA : capte `beforeinstallprompt` sur Android/Chrome
 * pour proposer un vrai bouton d'installation ; sur iOS (pas d'API équivalente)
 * affiche le mode d'emploi manuel (Partager → Ajouter à l'écran d'accueil).
 * Refus mémorisé en localStorage pour ne s'afficher qu'une fois.
 */
export function InstallPWABanner() {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isIOS()) {
      timer = setTimeout(() => {
        setIosMode(true);
        setVisible(true);
      }, SHOW_DELAY_MS);
    } else {
      const onBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      };
      window.addEventListener("beforeinstallprompt", onBeforeInstall);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
        if (timer) clearTimeout(timer);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    else dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[calc(76px+env(safe-area-inset-bottom))] lg:bottom-6 z-40 w-[calc(100%-24px)] max-w-[480px]">
      <div className="flex items-center gap-3 rounded-2xl bg-primary text-on-primary shadow-pop px-3 py-2.5">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-surface flex items-center justify-center">
          {iosMode ? (
            <Export size={18} weight="bold" className="text-primary-deep" aria-hidden />
          ) : (
            <DownloadSimple size={18} weight="bold" className="text-primary-deep" aria-hidden />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-bold">Installer KOTÉ MORIS</span>
          <span className="block text-[11.5px] opacity-85">
            {iosMode ? (
              <span className="inline-flex flex-wrap items-center gap-x-1">
                Appuyez sur
                <Export size={13} weight="bold" className="inline shrink-0" aria-hidden />
                Partager, puis
                <DotsThreeCircle size={13} weight="bold" className="inline shrink-0" aria-hidden />
                Plus, puis « Sur l&apos;écran d&apos;accueil »
              </span>
            ) : (
              "Accès rapide depuis l'écran d'accueil"
            )}
          </span>
        </span>
        {!iosMode && (
          <button
            onClick={install}
            className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-xl bg-surface text-primary-deep text-[13px] font-bold active:scale-[.97]"
          >
            Installer
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-on-primary/80 active:scale-[.97]"
        >
          <X size={16} weight="bold" aria-hidden />
        </button>
      </div>
    </div>
  );
}
