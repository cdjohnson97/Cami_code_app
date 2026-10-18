import type { AppState } from "@/lib/types";

// What follows the account across devices, split into the two MongoDB documents kept per user.
// Anything not listed here stays on the device only (route, animations, sidebarCollapsed…).

/** Learning progress → collection `progress`. */
export const PROGRESS_KEYS = [
  "completed",
  "code",
  "passAttempts",
  "earnedBadges",
  "streak",
  "bestStreak",
  "lastVisitDay",
  "storySeen",
  "sandboxCode",
  "completionDate",
] as const satisfies readonly (keyof AppState)[];

/** How the app looks and talks to the learner → collection `preferences`. */
export const PREFERENCE_KEYS = [
  "name",
  "gender",
  "nameAsked",
  "theme",
  "soundOn",
  "sandboxLang",
] as const satisfies readonly (keyof AppState)[];

export type ProgressData = Pick<AppState, (typeof PROGRESS_KEYS)[number]>;
export type PreferencesData = Pick<AppState, (typeof PREFERENCE_KEYS)[number]>;

function pick<K extends keyof AppState>(state: AppState, keys: readonly K[]): Pick<AppState, K> {
  const out = {} as Pick<AppState, K>;
  for (const key of keys) out[key] = state[key];
  return out;
}

export const pickProgress = (state: AppState): ProgressData => pick(state, PROGRESS_KEYS);
export const pickPreferences = (state: AppState): PreferencesData => pick(state, PREFERENCE_KEYS);

const trueKeys = (...maps: (Record<string, boolean> | undefined)[]) => {
  const out: Record<string, boolean> = {};
  for (const m of maps) for (const [k, v] of Object.entries(m ?? {})) if (v) out[k] = true;
  return out;
};

/**
 * Progress after sign-in = this device's progress MERGED with the account's — never one
 * overwriting the other. Signing in is required after the first chapter, so a learner typically
 * arrives with local progress; replacing it with the account's (possibly emptier) copy would
 * silently erase work. Rules: anything passed / earned / seen on either side is kept; the
 * account's saved code wins per exercise; streak comes from the most recent visit; best streak
 * is the max; completion date is the earliest.
 */
export function mergeProgress(local: ProgressData, remote: Partial<ProgressData>): ProgressData {
  const localIsNewer = (local.lastVisitDay ?? "") > (remote.lastVisitDay ?? "");
  const dates = [local.completionDate, remote.completionDate].filter((d): d is string => !!d).sort();
  return {
    completed: trueKeys(remote.completed, local.completed),
    earnedBadges: trueKeys(remote.earnedBadges, local.earnedBadges),
    storySeen: trueKeys(remote.storySeen, local.storySeen),
    code: { ...local.code, ...remote.code },
    sandboxCode: { ...local.sandboxCode, ...remote.sandboxCode },
    passAttempts: { ...local.passAttempts, ...remote.passAttempts },
    streak: localIsNewer ? local.streak : remote.streak ?? local.streak,
    lastVisitDay: localIsNewer ? local.lastVisitDay : remote.lastVisitDay ?? local.lastVisitDay,
    bestStreak: Math.max(local.bestStreak, remote.bestStreak ?? 0),
    completionDate: dates[0] ?? null,
  };
}

// ---------------------------------------------------------------------------------------------
// Server-side validation of what a client sends. The API never stores a field it doesn't know,
// nor a value of the wrong type — the payload goes straight into MongoDB, so this is the only
// thing standing between a hand-crafted request and the database.
// ---------------------------------------------------------------------------------------------

type Check = (v: unknown) => boolean;

const MAX_CODE_LENGTH = 20_000;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
// MongoDB treats "." and a leading "$" specially in field names — exercise ids never contain them.
const isSafeKey = (k: string) => k.length > 0 && k.length <= 64 && !k.includes(".") && !k.startsWith("$");

const isBool: Check = (v) => typeof v === "boolean";
const isCount: Check = (v) => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isString = (max: number): Check => (v) => typeof v === "string" && v.length <= max;
const nullable = (check: Check): Check => (v) => v === null || check(v);
const oneOf = (...values: readonly unknown[]): Check => (v) => values.includes(v);
const recordOf = (check: Check): Check => (v) =>
  isPlainObject(v) && Object.keys(v).length <= 1000 && Object.entries(v).every(([k, x]) => isSafeKey(k) && check(x));

const PROGRESS_SCHEMA: Record<keyof ProgressData, Check> = {
  completed: recordOf(isBool),
  code: recordOf(isString(MAX_CODE_LENGTH)),
  passAttempts: recordOf(isCount),
  earnedBadges: recordOf(isBool),
  streak: isCount,
  bestStreak: isCount,
  lastVisitDay: nullable(isString(10)),
  storySeen: recordOf(isBool),
  sandboxCode: recordOf(isString(MAX_CODE_LENGTH)),
  completionDate: nullable(isString(40)),
};

const PREFERENCES_SCHEMA: Record<keyof PreferencesData, Check> = {
  name: nullable(isString(30)),
  gender: nullable(oneOf("f", "m")),
  nameAsked: isBool,
  theme: oneOf("auto", "light", "dark"),
  soundOn: isBool,
  sandboxLang: oneOf("pseudo", "python"),
};

type Validated<T> = { ok: true; value: Partial<T> } | { ok: false; field: string };

function validate<T>(input: unknown, schema: Record<keyof T, Check>): Validated<T> {
  if (!isPlainObject(input)) return { ok: false, field: "(root)" };
  const value: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(input)) {
    const check = (schema as Record<string, Check>)[key];
    if (!check || !check(v)) return { ok: false, field: key };
    value[key] = v;
  }
  return { ok: true, value: value as Partial<T> };
}

export const validateProgress = (input: unknown) => validate<ProgressData>(input, PROGRESS_SCHEMA);
export const validatePreferences = (input: unknown) => validate<PreferencesData>(input, PREFERENCES_SCHEMA);
export { isPlainObject };
