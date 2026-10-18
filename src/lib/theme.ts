import { useSyncExternalStore } from "react";
import type { AppState } from "./types";

// The theme actually on screen: the "auto" setting follows the system, so it can be either.

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const mq = matchMedia(DARK_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const systemIsDark = () => matchMedia(DARK_QUERY).matches;

export function useResolvedTheme(setting: AppState["theme"]): "light" | "dark" {
  const dark = useSyncExternalStore(subscribe, systemIsDark, () => false);
  if (setting === "auto") return dark ? "dark" : "light";
  return setting;
}
