import { useSyncExternalStore } from "react";
import { cloudEnabled } from "./cloud/config";
import { chapterNeedsAccount } from "./progress";
import { useAuthStore } from "@/store/useAuthStore";

// "Sign in to go past the first chapter." Only when accounts exist (backend configured) and the
// device is online: offline there is no way to sign in, and a learner who installed the app
// must still be able to work on the train.

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useLoginGate() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const applies = cloudEnabled && online && !user;
  return {
    /** Session still being checked: don't flash the content nor the sign-in wall yet. */
    checking: (chapterId: string) => applies && authLoading && chapterNeedsAccount(chapterId),
    /** This chapter needs an account the learner hasn't signed in with. */
    mustSignIn: (chapterId: string) => applies && !authLoading && chapterNeedsAccount(chapterId),
  };
}
