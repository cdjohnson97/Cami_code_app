"use client";

import { useEffect, useRef } from "react";
import { getSession } from "next-auth/react";
import { cloudEnabled } from "@/lib/cloud/config";
import {
  pickPreferences,
  pickProgress,
  type PreferencesData,
  type ProgressData,
} from "@/lib/cloud/shape";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";

type RemoteData = {
  role: "student" | "admin";
  progress: Partial<ProgressData> | null;
  preferences: Partial<PreferencesData> | null;
};

/**
 * Mounted once near the root of the app. Renders nothing — it only:
 *  1. reads the Auth.js session into useAuthStore,
 *  2. on sign-in, pulls this account's progress + preferences from MongoDB (via /api/me) and
 *     loads them into useAppStore — or seeds MongoDB from local state the first time,
 *  3. afterwards, debounced-pushes whichever of the two documents actually changed.
 * A complete no-op (and safe to mount) when the cloud backend isn't configured.
 */
export function CloudSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setIsAdmin = useAuthStore((s) => s.setIsAdmin);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setSyncStatus = useAuthStore((s) => s.setSyncStatus);
  const user = useAuthStore((s) => s.user);

  const pulledForUser = useRef<string | null>(null);
  // Pushing is only allowed once the pull for this user has landed — otherwise a state change
  // during the pull (e.g. recordVisit) would overwrite the account's saved progress with this
  // device's local one.
  const readyForUser = useRef<string | null>(null);
  const lastPushed = useRef<{ progress: string | null; preferences: string | null }>({
    progress: null,
    preferences: null,
  });
  const schedulePush = useRef<(() => void) | null>(null);

  // 1. Read the session once. Signing in/out goes through a full-page redirect, so there's no
  //    live session change to listen for.
  useEffect(() => {
    if (!cloudEnabled) {
      setAuthLoading(false);
      return;
    }
    let cancelled = false;
    getSession()
      .then((session) => {
        if (cancelled) return;
        const u = session?.user;
        setUser(u?.id ? { id: u.id, email: u.email ?? null, name: u.name ?? null, image: u.image ?? null } : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setUser, setAuthLoading]);

  // 2. Pull once per sign-in.
  useEffect(() => {
    if (!user || !cloudEnabled) return;
    if (pulledForUser.current === user.id) return;
    pulledForUser.current = user.id;

    (async () => {
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error(`GET /api/me → ${res.status}`);
        const remote = (await res.json()) as RemoteData;
        setIsAdmin(remote.role === "admin");

        // The server wins for whatever it already has; a missing document falls back to this
        // device's state and gets created by the push below.
        if (remote.progress || remote.preferences) {
          const local = useAppStore.getState();
          useAppStore.getState().hydrateFromRemote({
            ...(remote.progress ?? pickProgress(local)),
            ...(remote.preferences ?? pickPreferences(local)),
          });
        }

        const state = useAppStore.getState();
        lastPushed.current = {
          progress: remote.progress ? JSON.stringify(pickProgress(state)) : null,
          preferences: remote.preferences ? JSON.stringify(pickPreferences(state)) : null,
        };
        readyForUser.current = user.id;
        setSyncStatus("synced");
        schedulePush.current?.();
      } catch {
        pulledForUser.current = null; // let a later sign-in / reload retry
        setSyncStatus("error");
      }
    })();
  }, [user, setSyncStatus, setIsAdmin]);

  // 3. Debounced push on every subsequent change.
  useEffect(() => {
    if (!cloudEnabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const flush = async () => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser || readyForUser.current !== currentUser.id) return;
      if (inFlight) {
        schedule();
        return;
      }

      const state = useAppStore.getState();
      const progress = pickProgress(state);
      const preferences = pickPreferences(state);
      const progressJson = JSON.stringify(progress);
      const preferencesJson = JSON.stringify(preferences);

      const body: { progress?: ProgressData; preferences?: PreferencesData } = {};
      if (progressJson !== lastPushed.current.progress) body.progress = progress;
      if (preferencesJson !== lastPushed.current.preferences) body.preferences = preferences;
      if (!body.progress && !body.preferences) return; // nothing relevant actually changed

      inFlight = true;
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`PUT /api/me → ${res.status}`);
        if (body.progress) lastPushed.current.progress = progressJson;
        if (body.preferences) lastPushed.current.preferences = preferencesJson;
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error"); // retried on the next state change
      } finally {
        inFlight = false;
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, 1000);
    };
    schedulePush.current = schedule;

    const unsub = useAppStore.subscribe(schedule);
    return () => {
      unsub();
      schedulePush.current = null;
      if (timer) clearTimeout(timer);
    };
  }, [setSyncStatus]);

  return null;
}
