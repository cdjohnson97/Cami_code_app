"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { HOME, routeFromPath, titleFor } from "@/lib/routes";
import { Sidebar } from "./Sidebar";
import { HomePage } from "./HomePage";
import { ChapterPage } from "./ChapterPage";
import { JourneyMapPage } from "./JourneyMapPage";
import { GlossaryPage } from "./GlossaryPage";
import { StatsPage } from "./StatsPage";
import { SandboxPage } from "./SandboxPage";
import { CertificatePage } from "./CertificatePage";
import { BadgesPage } from "./BadgesPage";
import { SettingsPage } from "./SettingsPage";
import { NotificationCenter } from "./NotificationCenter";
import { ChapterTravelOverlay } from "./ChapterTravelOverlay";
import { Mascot } from "./Mascot";
import { CloudSync } from "./CloudSync";
import { InstallBanner } from "./InstallBanner";
import { GenderChoice } from "./GenderChoice";
import { SplashScreen, shouldShowSplash } from "./SplashScreen";
import type { Gender } from "@/lib/types";
import { registerServiceWorker } from "@/lib/pwa";

function NameGate() {
  const nameAsked = useAppStore((s) => s.nameAsked);
  const setName = useAppStore((s) => s.setName);
  const setGender = useAppStore((s) => s.setGender);
  const markNameAsked = useAppStore((s) => s.markNameAsked);
  const [gender, setGenderDraft] = useState<Gender>(null);

  if (nameAsked) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-5" style={{ background: "rgba(20,18,28,0.45)" }}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="rounded-2xl border p-7 max-w-[380px] w-full"
        style={{ background: "var(--paper)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex justify-center mb-3"><Mascot mood="happy" size={72} interactive={false} /></div>
        <h2 className="text-xl mb-2 text-center">Bienvenue ✨</h2>
        <p className="text-[14.5px] text-center mb-4" style={{ color: "var(--ink-soft)" }}>
          Comment veux-tu que l&apos;appli t&apos;appelle ? (facultatif)
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("name") as HTMLInputElement);
            setGender(gender);
            setName(input.value.trim() || null);
          }}
        >
          <input
            name="name"
            placeholder="Ton prénom"
            maxLength={30}
            autoComplete="off"
            className="w-full rounded-[9px] border px-3 py-2.5 text-[15px] outline-none mb-3.5"
            style={{ borderColor: "var(--line-strong)", background: "var(--bg)", color: "var(--ink)" }}
          />
          <p className="text-[13.5px] mb-2" style={{ color: "var(--ink-soft)" }}>Et pour les accords (« prêt » ou « prête ») ?</p>
          <div className="mb-4">
            <GenderChoice value={gender} onChange={setGenderDraft} />
          </div>
          <div className="flex gap-2.5 justify-end">
            <button type="button" className="btn-ghost btn-sm" onClick={markNameAsked}>Passer</button>
            <button type="submit" className="btn-primary btn-sm">C&apos;est parti</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function AppShell() {
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);
  const route = useAppStore((s) => s.route);
  const theme = useAppStore((s) => s.theme);
  const recordVisit = useAppStore((s) => s.recordVisit);
  const syncRoute = useAppStore((s) => s.syncRoute);
  const pathname = usePathname();
  const [splash, setSplash] = useState(shouldShowSplash);
  const endSplash = useCallback(() => setSplash(false), []);

  useEffect(() => {
    // Wait for the persisted state to actually land before flipping `hydrated` — otherwise the
    // UI briefly renders with default state (e.g. the name gate re-appearing for a returning
    // visitor) until rehydration's async merge catches up a moment later.
    // The URL's view is applied in the same step, right before `hydrated`, so a deep link shows
    // its page straight away (no flash of the home page). It must NOT happen earlier: any store
    // update before rehydrate() makes the persist middleware write the default state over the
    // saved one in localStorage — i.e. opening a chapter link would wipe the learner's progress.
    Promise.resolve(useAppStore.persist.rehydrate()).finally(() => {
      syncRoute(routeFromPath(window.location.pathname) ?? HOME);
      setHydrated();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Afterwards the URL stays the source of truth: back/forward land here. For in-app clicks
  // goTo() already updated the store before pushing, so this is a no-op. Unknown paths never get
  // here — the server answers them with a 404.
  useEffect(() => {
    if (hydrated) syncRoute(routeFromPath(pathname) ?? HOME);
  }, [hydrated, pathname, syncRoute]);

  useEffect(() => {
    if (hydrated) document.title = titleFor(route); // before that, keep the server's title
  }, [hydrated, route]);

  // Offline support + installability (production builds only, see lib/pwa.ts).
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (hydrated) recordVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") root.setAttribute("data-theme", "light");
    else if (theme === "dark") root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
  }, [theme]);

  // Launch animation, once per app launch. It stays in the same place in the tree from the
  // loading state to the loaded app, so it isn't restarted when `hydrated` flips.
  const splashLayer = (
    <AnimatePresence>
      {splash && <SplashScreen key="splash" ready={hydrated} onDone={endSplash} />}
    </AnimatePresence>
  );

  if (!hydrated) {
    return (
      <>
        {!splash && (
          <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
            <Mascot mood="idle" size={72} interactive={false} />
          </div>
        )}
        {splashLayer}
      </>
    );
  }

  const key = route.view === "chapter" ? `chapter:${route.chapterId}` : route.view;

  return (
    <>
      {/* Column on phones (Sidebar's top bar above the page), row from md up (sidebar beside it).
          A plain row here turned the mobile top bar into a full-height column eating ~30% of the screen. */}
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 px-5 md:px-10 pt-10 md:pt-14 pb-24 max-w-[860px] mx-auto w-full">
          {/* The page itself waits for the launch animation, so its own entrance animation (the
              home page's waving mascot…) plays in view rather than behind the splash. */}
          {!splash && (
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                {route.view === "home" && <HomePage />}
                {route.view === "chapter" && <ChapterPage chapterId={route.chapterId} />}
                {route.view === "carte" && <JourneyMapPage />}
                {route.view === "glossaire" && <GlossaryPage />}
                {route.view === "stats" && <StatsPage />}
                {route.view === "sandbox" && <SandboxPage />}
                {route.view === "certificat" && <CertificatePage />}
                {route.view === "badges" && <BadgesPage />}
                {route.view === "reglages" && <SettingsPage />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
        <NameGate />
        <NotificationCenter />
        <ChapterTravelOverlay />
        <CloudSync />
        <InstallBanner />
      </div>
      {splashLayer}
    </>
  );
}
