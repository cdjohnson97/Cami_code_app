import { useSyncExternalStore } from "react";

// Browser-side PWA plumbing: service worker registration and install state. The install event
// itself is captured by an inline script in app/layout.tsx (it can fire before this code loads).

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __camiInstallPrompt?: InstallPromptEvent | null;
  }
  interface Navigator {
    standalone?: boolean; // iOS Safari, when launched from the home screen
  }
}

/** Production only: in `next dev` a worker would cache files that change on every edit. */
export function registerServiceWorker() {
  if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(async () => {
      const registration = await navigator.serviceWorker.ready;
      // Hand over what this page already downloaded before the worker existed (the lazily
      // loaded app chunk, fonts…) so the very first visit is enough to work offline.
      const urls = performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
        .filter((u) => u.startsWith(`${location.origin}/_next/static/`));
      registration.active?.postMessage({ type: "CACHE_URLS", urls });
    })
    .catch((err) => {
      // No worker (private mode, unsupported…): the app still works online.
      console.warn("CaMI : service worker non enregistré —", err);
    });
}

export type InstallState = {
  /** Running as the installed app (home screen / standalone window). */
  installed: boolean;
  /** The browser offered installation and we can show its dialog (Chrome, Edge, Android…). */
  canPrompt: boolean;
  /** iPhone / iPad: no install dialog, only Share → "Sur l'écran d'accueil". */
  ios: boolean;
};

const SERVER_STATE: InstallState = { installed: false, canPrompt: false, ios: false };
let snapshot: InstallState = SERVER_STATE;

function getSnapshot(): InstallState {
  const ua = navigator.userAgent;
  const next: InstallState = {
    installed: matchMedia("(display-mode: standalone)").matches || navigator.standalone === true,
    canPrompt: !!window.__camiInstallPrompt,
    ios: /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1),
  };
  // Same object while nothing changed — useSyncExternalStore compares by reference.
  if (next.installed !== snapshot.installed || next.canPrompt !== snapshot.canPrompt || next.ios !== snapshot.ios) {
    snapshot = next;
  }
  return snapshot;
}

function subscribe(onChange: () => void) {
  const standalone = matchMedia("(display-mode: standalone)");
  window.addEventListener("cami-pwa-change", onChange);
  standalone.addEventListener("change", onChange);
  return () => {
    window.removeEventListener("cami-pwa-change", onChange);
    standalone.removeEventListener("change", onChange);
  };
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/** Shows the browser's install dialog. Resolves to true if the learner accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = window.__camiInstallPrompt;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  window.__camiInstallPrompt = null; // usable once
  window.dispatchEvent(new Event("cami-pwa-change"));
  return outcome === "accepted";
}
