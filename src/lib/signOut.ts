"use client";

import { signOut } from "next-auth/react";
import { pickPreferences, pickProgress } from "@/lib/cloud/shape";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Signing out wipes this device's progress (on a shared computer, the next learner must not
 * inherit it — sign-in MERGES local progress into the account). So first make sure the latest
 * state is saved on the account: the regular sync is debounced and may be a second behind.
 *
 * Returns false when the save failed (offline, server error): the caller can then offer a
 * forced sign-out instead of silently losing unsynced work.
 */
export async function signOutSafely({ force = false }: { force?: boolean } = {}): Promise<boolean> {
  if (!force) {
    const state = useAppStore.getState();
    const saved = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: pickProgress(state), preferences: pickPreferences(state) }),
    }).then((r) => r.ok, () => false);
    if (!saved) return false;
  }

  // Order matters: forget the user FIRST, so CloudSync's debounced push (which only runs for
  // a signed-in user) can't send the wiped, empty state to the account during the redirect.
  useAuthStore.getState().setUser(null);
  useAppStore.getState().resetProgress();
  void signOut({ redirectTo: "/" });
  return true;
}
