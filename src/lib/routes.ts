// The app's URLs. Single source of truth shared by the server (which pages exist, their <title>)
// and the client (navigation, active link, back/forward). The app itself stays one long-lived
// client tree — see app/(parcours)/ — the URL just says which view it shows.
import { findChapterEntry, flatChapters } from "./progress";

export type View = "home" | "carte" | "glossaire" | "stats" | "sandbox" | "certificat" | "badges" | "reglages";
export type Route = { view: View } | { view: "chapter"; chapterId: string };

export const HOME: Route = { view: "home" };

const CHAPTER_SEGMENT = "chapitre";

/** URL segment of each non-chapter view (French, like the rest of the app). */
const SLUGS: Record<Exclude<View, "home">, string> = {
  carte: "carte",
  glossaire: "glossaire",
  stats: "stats",
  sandbox: "bac-a-sable",
  certificat: "certificat",
  badges: "badges",
  reglages: "reglages",
};
const VIEW_BY_SLUG = Object.fromEntries(Object.entries(SLUGS).map(([view, slug]) => [slug, view])) as Record<string, View>;

const SITE_TITLE = "CaMI — apprendre à coder et découvrir l'IA";
const VIEW_TITLES: Record<Exclude<View, "home">, string> = {
  carte: "Carte du voyage",
  glossaire: "Glossaire",
  stats: "Mes statistiques",
  sandbox: "Bac à sable",
  certificat: "Certificat",
  badges: "Badges",
  reglages: "Réglages",
};

/** A goTo() target — "home", a view name ("carte", "sandbox"…) or a chapter id — as a route. */
export function routeForTarget(target: string): Route {
  if (target === "home") return HOME;
  if (target in SLUGS) return { view: target as View };
  return { view: "chapter", chapterId: target };
}

export function pathFor(route: Route): string {
  if (route.view === "chapter") return `/${CHAPTER_SEGMENT}/${encodeURIComponent(route.chapterId)}`;
  if (route.view === "home") return "/";
  return `/${SLUGS[route.view]}`;
}

export const sameRoute = (a: Route, b: Route) => pathFor(a) === pathFor(b);

/** Path segments → route, or null when the path isn't a page of the app (→ 404). */
export function routeFromSegments(segments: string[]): Route | null {
  if (segments.length === 0) return HOME;
  if (segments.length === 1) {
    const view = VIEW_BY_SLUG[segments[0]];
    return view ? { view } : null;
  }
  if (segments.length === 2 && segments[0] === CHAPTER_SEGMENT && findChapterEntry(segments[1])) {
    return { view: "chapter", chapterId: segments[1] };
  }
  return null;
}

export function routeFromPath(pathname: string): Route | null {
  try {
    return routeFromSegments(pathname.split("/").filter(Boolean).map(decodeURIComponent));
  } catch {
    return null; // malformed %-escape
  }
}

export function titleFor(route: Route): string {
  if (route.view === "home") return SITE_TITLE;
  if (route.view === "chapter") {
    const entry = findChapterEntry(route.chapterId);
    return entry ? `${entry.chapter.title} · ${entry.phase.label} · CaMI` : "CaMI";
  }
  return `${VIEW_TITLES[route.view]} · CaMI`;
}

/** Every page of the app as path segments — what the server pre-renders (anything else is a 404). */
export function allRouteSegments(): string[][] {
  return [
    [],
    ...Object.values(SLUGS).map((slug) => [slug]),
    ...flatChapters().map((x) => [CHAPTER_SEGMENT, x.chapter.id]),
  ];
}
