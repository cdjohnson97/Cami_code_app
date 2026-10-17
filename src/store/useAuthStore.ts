"use client";

import { create } from "zustand";

export type AuthUser = { id: string; email: string | null; name: string | null; image: string | null };
export type SyncStatus = "idle" | "syncing" | "synced" | "error";

type AuthStore = {
  user: AuthUser | null;
  isAdmin: boolean;
  authLoading: boolean;
  syncStatus: SyncStatus;
  setUser: (u: AuthUser | null) => void;
  setIsAdmin: (v: boolean) => void;
  setAuthLoading: (v: boolean) => void;
  setSyncStatus: (s: SyncStatus) => void;
};

// Deliberately NOT persisted: the Auth.js session lives in its own HTTP-only cookie, this store
// just mirrors "who's signed in right now" for the UI (Réglages, admin link, sync indicator).
export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAdmin: false,
  authLoading: true,
  syncStatus: "idle",
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
}));
