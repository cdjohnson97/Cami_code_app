import type { Metadata, Viewport } from "next";

// Self-hosted font files (via @fontsource) instead of next/font/google: the app builds and runs
// fully offline / behind restrictive proxies, with no dependency on reaching fonts.googleapis.com
// at build time.
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/600-italic.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/700-italic.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CaMI — apprendre à coder et découvrir l'IA",
  description:
    "CaMI — un parcours pas à pas pour apprendre la logique de la programmation, du pseudocode jusqu'à Python avancé et l'intelligence artificielle.",
  applicationName: "CaMI",
  // iOS "Sur l'écran d'accueil": open full screen, named CaMI (icon: app/apple-icon.png).
  appleWebApp: { capable: true, title: "CaMI", statusBarStyle: "default" },
};

// Browser / status bar colour, following the system theme like the app does by default.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EFE7" },
    { media: "(prefers-color-scheme: dark)", color: "#17151F" },
  ],
};

// Runs before any app code: Chrome/Edge/Android announce installability once, possibly before
// the (lazy-loaded) app is there to listen. Keep the event so Réglages / the install banner can
// offer a real "Installer" button later (see lib/pwa.ts).
const CAPTURE_INSTALL_PROMPT = `
window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__camiInstallPrompt = e;
  window.dispatchEvent(new Event("cami-pwa-change"));
});
window.addEventListener("appinstalled", function () {
  window.__camiInstallPrompt = null;
  window.dispatchEvent(new Event("cami-pwa-change"));
});`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CAPTURE_INSTALL_PROMPT }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
