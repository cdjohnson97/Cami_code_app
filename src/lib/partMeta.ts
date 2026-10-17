// Presentation metadata for the 4 parts of the course — kept separate from CURRICULUM (which only
// carries label/shortLabel/langTag) so the home page can show a correct, distinct tagline per part.
// This is also where the "Partie 4 talked about Python" mislabeling gets fixed for good: its
// tagline is explicitly about AI, never about Python syntax.
export const PART_META: Record<string, { icon: string; tagline: string; color: string; soft: string }> = {
  algo: {
    icon: "🧭",
    tagline: "Les tout premiers pas : la logique d'un programme, en pseudocode.",
    color: "var(--part-algo)",
    soft: "var(--part-algo-soft)",
  },
  python: {
    icon: "🐍",
    tagline: "La syntaxe d'un vrai langage : variables, boucles, listes, fichiers en Python.",
    color: "var(--part-python)",
    soft: "var(--part-python-soft)",
  },
  avance: {
    icon: "🧩",
    tagline: "Python en profondeur : classes, récursivité, compréhensions, fichiers.",
    color: "var(--part-avance)",
    soft: "var(--part-avance-soft)",
  },
  ia: {
    icon: "🤖",
    tagline: "Coder tes premières intelligences artificielles, pas à pas — pas de théorie, juste des mini-IA que tu construis toi-même.",
    color: "var(--part-ia)",
    soft: "var(--part-ia-soft)",
  },
};
