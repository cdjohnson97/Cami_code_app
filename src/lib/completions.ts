// Editor autocompletion — pure functions, no DOM. Suggests only what algoEngineCore.js actually
// understands (keywords, builtins, methods), plus the names already used in the learner's code.
// Spellings follow the curriculum's own conventions (FINSI / FINPOUR in one word, TANT QUE and
// SINON SI in two) so a suggestion never teaches a form the exercises don't use.

export type CompletionKind = "variable" | "function" | "snippet" | "keyword" | "method";

export type Completion = {
  label: string;
  /** Text inserted in place of the typed prefix. Snippet syntax: "\n" starts a new line at the
   *  current indentation, each leading "\t" on a line adds one level (4 spaces), "$0" is where
   *  the caret lands. */
  insert: string;
  kind: CompletionKind;
  detail?: string;
};

export type CompletionResult = { from: number; to: number; items: Completion[] };

const INDENT = "    ";
const IDENT_CHAR = /[A-Za-zÀ-ÖØ-öø-ÿ0-9_]/;
const IDENT_RE = /[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*/g;
const MAX_ITEMS = 12;

export const isIdentChar = (c: string | undefined) => !!c && IDENT_CHAR.test(c);

// ---------------------------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------------------------

const fn = (name: string, detail: string): Completion => ({ label: name, insert: `${name}($0)`, kind: "function", detail });
const kw = (label: string, detail?: string): Completion => ({ label, insert: label, kind: "keyword", detail });
const snip = (label: string, insert: string, detail: string): Completion => ({ label, insert, kind: "snippet", detail });

// Builtins are shared by both languages (one interpreter behind both parsers).
const BUILTINS: Completion[] = [
  fn("len", "longueur d'un texte, d'une liste…"),
  fn("str", "convertir en texte"),
  fn("int", "convertir en nombre entier"),
  fn("float", "convertir en nombre à virgule"),
  fn("abs", "valeur absolue"),
  fn("max", "plus grande valeur"),
  fn("min", "plus petite valeur"),
  fn("sum", "somme d'une liste"),
  fn("sorted", "copie triée d'une liste"),
  fn("round", "arrondir"),
  fn("range", "suite de nombres"),
  fn("list", "convertir en liste"),
  fn("write_file", "écrire un fichier"),
  fn("read_file", "lire un fichier"),
  fn("file_exists", "le fichier existe ?"),
];

const PYTHON: Completion[] = [
  snip("if", "if $0:\n\t", "condition"),
  snip("elif", "elif $0:\n\t", "sinon si"),
  snip("else", "else:\n\t$0", "sinon"),
  snip("for", "for i in range($0):\n\t", "boucle sur un intervalle"),
  snip("for", "for element in $0:\n\t", "boucle sur une liste"),
  snip("while", "while $0:\n\t", "boucle tant que"),
  snip("def", "def $0():\n\t", "définir une fonction"),
  snip("class", "class $0:\n\tdef __init__(self):\n\t\t", "définir une classe"),
  snip("try", "try:\n\t$0\nexcept:\n\t", "gérer une erreur"),
  fn("print", "afficher"),
  kw("return", "renvoyer une valeur"),
  kw("break", "sortir de la boucle"),
  kw("continue", "passer au tour suivant"),
  kw("except"),
  kw("in"),
  kw("and"),
  kw("or"),
  kw("not"),
  kw("True"),
  kw("False"),
  kw("None"),
  kw("self"),
  ...BUILTINS,
];

const PSEUDO: Completion[] = [
  snip("SI", "SI $0 ALORS\n\t\nFINSI", "condition"),
  snip("SINON SI", "SINON SI $0 ALORS", "autre condition"),
  snip("TANT QUE", "TANT QUE $0\n\t\nFINTANTQUE", "boucle tant que"),
  snip("POUR", "POUR i DE 1 A $0\n\t\nFINPOUR", "boucle pour"),
  snip("FONCTION", "FONCTION $0()\n\t\nFINFONCTION", "définir une fonction"),
  fn("AFFICHER", "afficher"),
  kw("VARIABLE", "déclarer une variable"),
  kw("ALORS"),
  kw("SINON"),
  kw("FINSI"),
  kw("FINPOUR"),
  kw("FINTANTQUE"),
  kw("FINFONCTION"),
  kw("RETOURNER", "renvoyer une valeur"),
  kw("DE"),
  kw("A"),
  kw("PAS", "pas de la boucle"),
  kw("ET"),
  kw("OU"),
  kw("NON"),
  kw("VRAI"),
  kw("FAUX"),
  kw("RIEN"),
  ...BUILTINS,
];

// Methods the interpreter implements (algoEngineCore.js → callMethod). No type inference here:
// after a ".", every method is offered, labelled with the kind of value it applies to.
const METHODS: Completion[] = [
  ["upper", "texte"], ["lower", "texte"], ["strip", "texte"], ["capitalize", "texte"],
  ["split", "texte"], ["replace", "texte"], ["join", "texte"], ["startswith", "texte"],
  ["endswith", "texte"], ["find", "texte"], ["count", "texte, liste"],
  ["append", "liste"], ["insert", "liste"], ["remove", "liste"], ["pop", "liste, dictionnaire"],
  ["sort", "liste"], ["reverse", "liste"], ["index", "liste"],
  ["get", "dictionnaire"], ["keys", "dictionnaire"], ["values", "dictionnaire"], ["items", "dictionnaire"],
].map(([name, detail]) => ({ label: name, insert: `${name}($0)`, kind: "method" as const, detail }));

const VOCABULARY: Record<string, Completion[]> = { python: PYTHON, pseudo: PSEUDO };

// ---------------------------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------------------------

/** True when `col` on this line falls inside a string literal or a comment. */
function inStringOrComment(line: string, col: number): boolean {
  let quote: string | null = null;
  for (let i = 0; i < col; i++) {
    const c = line[i];
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "#") return true;
  }
  return quote !== null;
}

/** Code with string literals and comments blanked out, so names inside them aren't suggested. */
function stripStringsAndComments(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      let out = "";
      let quote: string | null = null;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (quote) {
          if (c === "\\") { out += "  "; i++; continue; }
          if (c === quote) quote = null;
          out += " ";
        } else if (c === '"' || c === "'") { quote = c; out += " "; }
        else if (c === "#") break;
        else out += c;
      }
      return out;
    })
    .join("\n");
}

/** Names used in the code (minus the one being typed), with functions/classes told apart. */
function namesInCode(code: string, lang: string, known: Set<string>): Completion[] {
  const clean = stripStringsAndComments(code);
  const callable = new Set<string>();
  const defRe = lang === "python"
    ? /\b(?:def|class)\s+([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)/g
    : /\bFONCTION\s+([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)/g;
  for (const m of clean.matchAll(defRe)) callable.add(m[1]);

  const seen = new Set<string>();
  const out: Completion[] = [];
  for (const m of clean.matchAll(IDENT_RE)) {
    const name = m[0];
    if (seen.has(name) || known.has(name) || name.length < 2) continue;
    seen.add(name);
    out.push(callable.has(name)
      ? { label: name, insert: `${name}($0)`, kind: "function", detail: "ta fonction" }
      : { label: name, insert: name, kind: "variable" });
  }
  return out;
}

/** `self.something` attributes, offered after "self." in Python classes. */
function selfAttributes(code: string): Completion[] {
  const names = new Set<string>();
  for (const m of stripStringsAndComments(code).matchAll(/\bself\.([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)/g)) names.add(m[1]);
  return [...names].map((name) => ({ label: name, insert: name, kind: "variable" as const, detail: "attribut" }));
}

const KIND_ORDER: Record<CompletionKind, number> = { variable: 0, function: 1, snippet: 2, keyword: 3, method: 4 };
const plainInsert = (c: Completion) => c.insert.replace("$0", "");

// ---------------------------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------------------------

/**
 * Suggestions for the caret at `cursor`. `manual` (Ctrl+Espace) also works with nothing typed
 * yet; otherwise at least one character, or a "." right before the caret, is required.
 * Returns null when there's nothing useful to show.
 */
export function getCompletions(code: string, cursor: number, lang: string, manual = false): CompletionResult | null {
  const lineStart = code.lastIndexOf("\n", cursor - 1) + 1;
  const line = code.slice(lineStart, code.indexOf("\n", cursor) === -1 ? code.length : code.indexOf("\n", cursor));
  const col = cursor - lineStart;
  if (inStringOrComment(line, col)) return null;

  let from = cursor;
  while (from > lineStart && isIdentChar(code[from - 1])) from--;
  let to = cursor;
  while (to < code.length && isIdentChar(code[to])) to++;
  const prefix = code.slice(from, cursor);
  if (/^\d/.test(prefix)) return null; // typing a number

  const member = code[from - 1] === ".";
  if (!member && !prefix && !manual) return null;

  let candidates: Completion[];
  if (member) {
    const before = code.slice(lineStart, from - 1);
    if (!/([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*|[)\]"'])$/.test(before)) return null; // e.g. "3."
    candidates = /\bself$/.test(before) && lang === "python" ? [...selfAttributes(code), ...METHODS] : METHODS;
  } else {
    const vocabulary = VOCABULARY[lang] ?? [];
    const known = new Set(vocabulary.map((c) => c.label));
    const others = code.slice(0, from) + code.slice(to); // don't suggest the word being typed itself
    candidates = [...namesInCode(others, lang, known), ...vocabulary];
  }

  // A word that's already complete (SINON, return, total…) closes the automatic popup: otherwise
  // the Enter that ends the line would accept a longer suggestion (SINON → "SINON SI"). Block
  // snippets are exempt — "for" / "SI" are followed by a space, never by Enter, and the whole
  // point is to offer the block once the keyword is typed.
  const complete = (c: Completion) => c.kind !== "snippet" && (c.label === prefix || plainInsert(c) === prefix);
  if (!manual && prefix && candidates.some(complete)) return null;

  const p = prefix.toLowerCase();
  const items = candidates
    .filter((c) => c.label.toLowerCase().startsWith(p) && plainInsert(c) !== prefix)
    .sort((a, b) =>
      Number(!b.label.startsWith(prefix)) - Number(!a.label.startsWith(prefix)) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      a.label.length - b.label.length ||
      a.label.localeCompare(b.label)
    )
    .slice(0, MAX_ITEMS);

  return items.length ? { from, to, items } : null;
}

/**
 * Applies a completion: replaces code[from, to) with the expanded snippet. Returns the new code
 * and where the caret should go.
 */
export function applyCompletion(code: string, result: CompletionResult, item: Completion): { code: string; cursor: number } {
  const lineStart = code.lastIndexOf("\n", result.from - 1) + 1;
  const baseIndent = code.slice(lineStart).match(/^[ \t]*/)![0];

  // Don't double the parentheses when the learner already typed them: "len|()" → "len()".
  let insert = item.insert;
  if (insert.endsWith("($0)") && code[result.to] === "(") insert = insert.slice(0, -4) + "$0";

  const text = insert
    .split("\n")
    .map((l, i) => {
      const levels = l.match(/^\t*/)![0].length;
      const body = l.slice(levels);
      return i === 0 ? body : baseIndent + INDENT.repeat(levels) + body;
    })
    .join("\n");

  const caret = text.indexOf("$0");
  const finalText = text.replace("$0", "");
  return {
    code: code.slice(0, result.from) + finalText + code.slice(result.to),
    cursor: result.from + (caret === -1 ? finalText.length : caret),
  };
}
