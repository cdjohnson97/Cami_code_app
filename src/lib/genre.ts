import type { Gender } from "./types";

/**
 * Picks the form agreeing with how the learner wants to be addressed (chosen in the welcome
 * dialog or Réglages). Without a choice, the inclusive form is used.
 *   accord(gender, "prêt", "prête", "prêt·e")
 */
export function accord(gender: Gender, masculin: string, feminin: string, inclusif: string): string {
  if (gender === "f") return feminin;
  if (gender === "m") return masculin;
  return inclusif;
}

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "f", label: "Au féminin" },
  { value: "m", label: "Au masculin" },
  { value: null, label: "Peu importe" },
];
