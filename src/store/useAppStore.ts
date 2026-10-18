"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AppState, Badge } from "@/lib/types";
import { evaluateBadges } from "@/lib/progress";
import { HOME, pathFor, routeForTarget, sameRoute, type Route } from "@/lib/routes";

const STORAGE_KEY = "cami_state_v1";

type Store = AppState & {
  route: Route;
  hydrated: boolean;
  lastEarnedBadges: Badge[];
  lastChapterCelebration: { chapterId: string; token: number } | null;
  travelAnimation: { fromChapterId: string | null; toChapterId: string; token: number } | null;
  // Desktop sidebar collapse toggle. Local device preference — persisted to localStorage like
  // the rest of AppState, but deliberately NOT part of AppState/SYNCED_KEYS: it's a UI layout
  // preference, not progress data, so it has no business following the account across devices.
  sidebarCollapsed: boolean;

  /** Navigate: pushes the page's URL, then shows it. `target` = "home", a view name, or a chapter id. */
  goTo: (target: string) => void;
  /** Shows `route` (no-op if already shown). Called by goTo and, for back/forward, by AppShell. */
  syncRoute: (route: Route) => void;
  setName: (name: string | null) => void;
  setGender: (gender: AppState["gender"]) => void;
  markNameAsked: () => void;
  saveCode: (exerciseId: string, code: string) => void;
  registerAttempt: (exerciseId: string) => number;
  completeExercise: (exerciseId: string, chapterId: string) => void;
  clearLastEarnedBadges: () => void;
  clearTravelAnimation: () => void;
  markStorySeen: (chapterId: string) => void;
  setTheme: (theme: AppState["theme"]) => void;
  setSoundOn: (v: boolean) => void;
  setSandboxCode: (lang: string, code: string) => void;
  setSandboxLang: (lang: AppState["sandboxLang"]) => void;
  recordVisit: () => void;
  resetProgress: () => void;
  setHydrated: () => void;
  setCompletionDate: (iso: string) => void;
  hydrateFromRemote: (data: Partial<AppState>) => void;
  toggleSidebar: () => void;
};

const initialAppState: AppState = {
  name: null,
  gender: null,
  nameAsked: false,
  completed: {},
  code: {},
  passAttempts: {},
  earnedBadges: {},
  streak: 0,
  bestStreak: 0,
  lastVisitDay: null,
  storySeen: {},
  theme: "auto",
  sandboxCode: {},
  sandboxLang: "pseudo",
  soundOn: true,
  completionDate: null,
};

const attemptsThisSession: Record<string, number> = {};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialAppState,
      route: HOME,
      hydrated: false,
      lastEarnedBadges: [],
      lastChapterCelebration: null,
      travelAnimation: null,
      sidebarCollapsed: false,

      setHydrated: () => set({ hydrated: true }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      goTo: (target) => {
        const route = routeForTarget(target);
        // Native pushState is integrated with the Next.js router (usePathname follows it) and
        // costs no server round-trip — the page is already here, only the URL changes.
        const path = pathFor(route);
        if (typeof window !== "undefined" && window.location.pathname !== path) window.history.pushState(null, "", path);
        get().syncRoute(route);
      },
      syncRoute: (route) => {
        const prev = get().route;
        if (sameRoute(prev, route)) return;
        const fromChapterId = prev.view === "chapter" ? prev.chapterId : null;
        set({
          route,
          travelAnimation: route.view === "chapter" && fromChapterId && fromChapterId !== route.chapterId
            ? { fromChapterId, toChapterId: route.chapterId, token: Date.now() }
            : get().travelAnimation,
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      },
      clearTravelAnimation: () => set({ travelAnimation: null }),

      setName: (name) => set({ name, nameAsked: true }),
      setGender: (gender) => set({ gender }),
      markNameAsked: () => set({ nameAsked: true }),

      saveCode: (exerciseId, code) => set((s) => ({ code: { ...s.code, [exerciseId]: code } })),

      registerAttempt: (exerciseId) => {
        attemptsThisSession[exerciseId] = (attemptsThisSession[exerciseId] || 0) + 1;
        return attemptsThisSession[exerciseId];
      },

      completeExercise: (exerciseId, chapterId) => {
        const already = get().completed[exerciseId];
        const failuresBeforePass = Math.max(0, (attemptsThisSession[exerciseId] || 1) - 1);
        set((s) => ({
          completed: { ...s.completed, [exerciseId]: true },
          passAttempts: already ? s.passAttempts : { ...s.passAttempts, [exerciseId]: failuresBeforePass },
        }));
        if (already) return;
        const s = get();
        const newly = evaluateBadges(
          { completed: s.completed, passAttempts: s.passAttempts, streak: s.streak },
          s.earnedBadges
        );
        if (newly.length) {
          set((st) => ({
            earnedBadges: { ...st.earnedBadges, ...Object.fromEntries(newly.map((b) => [b.id, true])) },
            lastEarnedBadges: [...st.lastEarnedBadges, ...newly],
          }));
        }
        set({ lastChapterCelebration: { chapterId, token: Date.now() } });
      },
      clearLastEarnedBadges: () => set({ lastEarnedBadges: [] }),

      markStorySeen: (chapterId) => set((s) => ({ storySeen: { ...s.storySeen, [chapterId]: true } })),

      setTheme: (theme) => set({ theme }),
      setSoundOn: (v) => set({ soundOn: v }),

      setSandboxCode: (lang, code) => set((s) => ({ sandboxCode: { ...s.sandboxCode, [lang]: code } })),
      setSandboxLang: (lang) => set({ sandboxLang: lang }),

      recordVisit: () => {
        const today = new Date().toISOString().slice(0, 10);
        const s = get();
        if (s.lastVisitDay === today) return;
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const nextStreak = s.lastVisitDay === yesterday ? s.streak + 1 : 1;
        set({
          lastVisitDay: today,
          streak: nextStreak,
          bestStreak: Math.max(s.bestStreak, nextStreak),
        });
      },

      resetProgress: () => {
        set({ ...initialAppState });
        get().goTo("home");
      },
      setCompletionDate: (iso) => set((s) => (s.completionDate ? {} : { completionDate: iso })),

      // Called once after sign-in, with whatever this account already had saved in MongoDB —
      // replaces the relevant slice of local state so this device picks up where the account
      // left off (e.g. progress made on a different computer).
      hydrateFromRemote: (data) => set((s) => ({ ...s, ...initialAppState, ...data })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        const { route, hydrated, lastEarnedBadges, lastChapterCelebration, travelAnimation, ...persisted } = s;
        void route; void hydrated; void lastEarnedBadges; void lastChapterCelebration; void travelAnimation;
        return persisted;
      },
    }
  )
);
