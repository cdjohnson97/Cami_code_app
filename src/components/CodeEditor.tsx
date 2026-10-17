"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { highlightCode } from "@/lib/highlight";
import {
  applyCompletion,
  getCompletions,
  isIdentChar,
  type Completion,
  type CompletionKind,
  type CompletionResult,
} from "@/lib/completions";
import { diagnose, type Diagnostic } from "@/lib/diagnostics";

// Must match the textarea/pre padding classes below (px-4 / py-3.5).
const PAD_X = 16;
const PAD_Y = 14;
const POPUP_WIDTH = 300;
const POPUP_MAX_HEIGHT = 236;
// Pause after the last keystroke before re-checking the code for errors.
const DIAGNOSE_DELAY_MS = 450;

type Popup = CompletionResult & {
  selected: number;
  manual: boolean;
  left: number;
  /** Viewport y of the caret line's top / bottom edge — the list opens below, or above if no room. */
  lineTop: number;
  lineBottom: number;
};

const KIND_BADGE: Record<CompletionKind, { glyph: string; color: string; name: string }> = {
  variable: { glyph: "x", color: "var(--editor-num)", name: "variable" },
  function: { glyph: "ƒ", color: "var(--editor-fn)", name: "fonction" },
  snippet: { glyph: "{}", color: "var(--editor-str)", name: "bloc" },
  keyword: { glyph: "k", color: "var(--editor-kw)", name: "mot-clé" },
  method: { glyph: "m", color: "var(--editor-fn)", name: "méthode" },
};

// Symbol bar: the characters beginners hunt for on a phone keyboard (or an AZERTY one). Openers
// insert their closing pair with the caret inside, or wrap the selection.
type SymbolKey = { insert: string; label?: string; name: string };
const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'" };
const INDENT_KEY: SymbolKey = { insert: "    ", label: "⇥", name: "Indenter (4 espaces)" };
const SYMBOLS: Record<string, SymbolKey[]> = {
  python: [
    INDENT_KEY,
    { insert: "(", name: "parenthèses" }, { insert: ":", name: "deux-points" }, { insert: '"', name: "guillemets" },
    { insert: "=", name: "égal" }, { insert: "==", name: "égal à" }, { insert: "!=", name: "différent de" },
    { insert: "<", name: "inférieur" }, { insert: ">", name: "supérieur" },
    { insert: "[", name: "crochets" }, { insert: "{", name: "accolades" },
    { insert: "+", name: "plus" }, { insert: "-", name: "moins" }, { insert: "*", name: "multiplié" }, { insert: "/", name: "divisé" },
    { insert: "%", name: "modulo" }, { insert: ",", name: "virgule" }, { insert: ".", name: "point" },
    { insert: "'", name: "apostrophes" }, { insert: "_", name: "tiret bas" }, { insert: "#", name: "commentaire" },
  ],
  pseudo: [
    INDENT_KEY,
    { insert: "(", name: "parenthèses" }, { insert: '"', name: "guillemets" },
    { insert: "=", name: "égal" }, { insert: "==", name: "égal à" }, { insert: "!=", name: "différent de" },
    { insert: "<", name: "inférieur" }, { insert: ">", name: "supérieur" }, { insert: "<=", name: "inférieur ou égal" }, { insert: ">=", name: "supérieur ou égal" },
    { insert: "+", name: "plus" }, { insert: "-", name: "moins" }, { insert: "*", name: "multiplié" }, { insert: "/", name: "divisé" },
    { insert: "%", name: "modulo" }, { insert: ",", name: "virgule" }, { insert: "[", name: "crochets" },
    { insert: "_", name: "tiret bas" }, { insert: "#", name: "commentaire" },
  ],
};

let measureCanvas: HTMLCanvasElement | null = null;

/** Viewport coordinates of character offset `pos` in the textarea (monospace, no wrapping). */
function caretCoords(ta: HTMLTextAreaElement, pos: number) {
  const style = getComputedStyle(ta);
  const lineHeight = parseFloat(style.lineHeight);
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d")!;
  ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const charWidth = ctx.measureText("M").width;

  const before = ta.value.slice(0, pos);
  const lineIndex = before.split("\n").length - 1;
  const col = pos - (before.lastIndexOf("\n") + 1);
  const rect = ta.getBoundingClientRect();
  const lineTop = rect.top + PAD_Y + lineIndex * lineHeight;
  return {
    left: rect.left + PAD_X + col * charWidth - ta.scrollLeft,
    lineTop,
    lineBottom: lineTop + lineHeight,
  };
}

export function CodeEditor({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const lineCount = value.split("\n").length;

  const [popup, setPopup] = useState<Popup | null>(null);
  // Errors only show up once the learner has typed something — a pristine starter that doesn't
  // run yet (blanks to fill in) shouldn't greet them in red.
  const [touched, setTouched] = useState(false);
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);

  // Lines don't wrap (see the `wrap="off"` textarea below), so a line long enough to overflow
  // horizontally makes the textarea scroll sideways on its own — natively, a textarea always
  // owns its own horizontal scroll regardless of CSS. The highlighted <pre> underneath needs its
  // scrollLeft mirrored to match, and re-synced after every re-render (re-highlighting resets
  // the <pre>'s own scrollLeft to 0, same as it would for scrollTop). Vertical scroll doesn't
  // need this: the textarea's `rows` is kept equal to the line count so it's always exactly as
  // tall as its content and never scrolls vertically on its own in the first place.
  function syncScrollX() {
    if (taRef.current && preRef.current) preRef.current.scrollLeft = taRef.current.scrollLeft;
  }
  useLayoutEffect(() => {
    syncScrollX();
  });

  // ---- Live errors ----
  useEffect(() => {
    if (!touched) return;
    const timer = setTimeout(() => setDiagnostic(diagnose(value, lang)), DIAGNOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [value, lang, touched]);

  const errorLine = diagnostic?.line ?? null;

  const highlighted = useMemo(() => {
    const lines = highlightCode(value, lang).split("\n");
    const i = errorLine ? errorLine - 1 : -1;
    if (i >= 0 && i < lines.length) {
      // Squiggle the line's content, not its indentation. highlightCode emits one line per "\n"
      // with tags never spanning lines, so wrapping a single line's HTML is safe.
      const [, indent, rest] = lines[i].match(/^([ \t]*)([\s\S]*)$/)!;
      if (rest.trim()) lines[i] = `${indent}<span class="diag-squiggle">${rest}</span>`;
    }
    return lines.join("\n");
  }, [value, lang, errorLine]);

  // ---- Suggestions ----
  function openPopup(code: string, cursor: number, manual: boolean) {
    const ta = taRef.current;
    const result = ta ? getCompletions(code, cursor, lang, manual) : null;
    if (!ta || !result) {
      setPopup(null);
      return;
    }
    const coords = caretCoords(ta, result.from);
    setPopup({ ...result, ...coords, selected: 0, manual });
  }

  function accept(item: Completion) {
    if (!popup) return;
    const next = applyCompletion(value, popup, item);
    setPopup(null);
    setTouched(true);
    onChange(next.code);
    const ta = taRef.current;
    requestAnimationFrame(() => {
      if (ta) ta.selectionStart = ta.selectionEnd = next.cursor;
    });
  }

  // Scrolling or resizing moves the caret; the list follows it rather than closing — on phones the
  // page scrolls by itself while typing (keeping the caret visible, keyboard opening/closing), and
  // a list that vanished on every such scroll would be useless there. It only closes once the
  // caret line has left the screen. The list scrolling its own items is ignored.
  const popupOpen = popup !== null;
  useEffect(() => {
    if (!popupOpen) return;
    const follow = (e: Event) => {
      if (e.target instanceof Node && listRef.current?.contains(e.target)) return;
      const ta = taRef.current;
      setPopup((p) => {
        if (!p || !ta) return p;
        const coords = caretCoords(ta, p.from);
        return coords.lineBottom < 0 || coords.lineTop > window.innerHeight ? null : { ...p, ...coords };
      });
    };
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [popupOpen]);

  // Keep the highlighted suggestion visible while moving through a long list.
  const selectedIndex = popup?.selected ?? -1;
  useEffect(() => {
    if (selectedIndex >= 0) listRef.current?.children[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const cursor = e.target.selectionStart;
    const typedOneChar = next.length === value.length + 1;
    const typed = next[cursor - 1];
    onChange(next);
    setTouched(true);

    if (typedOneChar && (isIdentChar(typed) || typed === ".")) openPopup(next, cursor, popup?.manual ?? false);
    else if (popup && next.length < value.length) openPopup(next, cursor, popup.manual); // backspace: re-filter
    else setPopup(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;

    if (popup) {
      const count = popup.items.length;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const step = e.key === "ArrowDown" ? 1 : -1;
        setPopup({ ...popup, selected: (popup.selected + step + count) % count });
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        accept(popup.items[popup.selected]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPopup(null);
        return;
      }
      if (["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) setPopup(null);
    }

    if (e.key === " " && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      openPopup(value, ta.selectionStart, true);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = ta.selectionStart, end = ta.selectionEnd;
      const next = value.slice(0, start) + "    " + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
    } else if (e.key === "Enter") {
      const start = ta.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const indentMatch = currentLine.match(/^[ \t]*/);
      let indent = indentMatch ? indentMatch[0] : "";
      if (/:\s*$/.test(currentLine)) indent += "    ";
      if (indent) {
        e.preventDefault();
        const next = value.slice(0, start) + "\n" + indent + value.slice(ta.selectionEnd);
        onChange(next);
        const pos = start + 1 + indent.length;
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos; });
      }
    }
  }

  /**
   * Inserts a symbol from the bar at the caret. Goes through the browser's own text insertion
   * (execCommand "insertText") so it lands in the native undo history (Ctrl+Z) and fires the
   * usual input event — suggestions and live errors react exactly as if it had been typed.
   */
  function insertSymbol(key: SymbolKey) {
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    const { selectionStart: start, selectionEnd: end } = ta;
    const selected = value.slice(start, end);
    const close = PAIRS[key.insert];
    const text = close ? key.insert + selected + close : key.insert;
    // Caret after the inserted text — or right after the opener when nothing was selected.
    const caret = close && !selected ? start + key.insert.length : start + text.length;

    const inserted = document.execCommand?.("insertText", false, text);
    if (!inserted) {
      // Fallback (very old browsers): direct update, no undo entry.
      onChange(value.slice(0, start) + text + value.slice(end));
      setTouched(true);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = caret; });
      return;
    }
    ta.selectionStart = ta.selectionEnd = caret;
  }

  /** Clicking the error message puts the caret at the start of the faulty line. */
  function goToErrorLine() {
    const ta = taRef.current;
    if (!ta || !errorLine) return;
    const lines = value.split("\n");
    const lineIndex = Math.min(errorLine, lines.length) - 1;
    let pos = 0;
    for (let i = 0; i < lineIndex; i++) pos += lines[i].length + 1;
    pos += lines[lineIndex].match(/^[ \t]*/)![0].length;
    ta.focus();
    ta.selectionStart = ta.selectionEnd = pos;
  }

  const activeId = popup ? `${listId}-${popup.selected}` : undefined;
  const placeAbove = popup ? popup.lineBottom + POPUP_MAX_HEIGHT + 8 > window.innerHeight && popup.lineTop > POPUP_MAX_HEIGHT : false;

  return (
    // No font ligatures: JetBrains Mono would draw "!=" as "≠" and "==" as one long bar — a
    // beginner must see exactly the characters to type.
    <div className="rounded-[11px] overflow-hidden border [font-variant-ligatures:none]" style={{ borderColor: "var(--editor-line)", background: "var(--editor-bg)" }}>
      {/*
        Line numbers, the highlighted overlay and the (invisible-text) textarea all sit at their
        natural content height here — none of them scrolls on its own. Only THIS wrapper scrolls,
        as one unit, past max-height. Previously the textarea had a fixed height and scrolled
        internally while the gutter/highlight overlay grew to full content height instead — so
        the caret (inside the textarea's own small scrolled viewport) and the visible highlighted
        text (unscrolled, showing everything) drifted apart the moment the code got taller than
        that fixed height. A single shared scroll container removes the two-scroll-positions
        problem entirely instead of trying to keep them in sync via JS.
      */}
      <div className="flex overflow-y-auto overflow-x-hidden min-h-[100px] max-h-[60vh]">
        <div
          aria-hidden="true"
          className="flex-none py-3.5 pr-2.5 pl-3.5 text-right select-none font-mono text-[13.5px] leading-[1.65]"
          style={{ color: "var(--editor-ink-soft)" }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={i + 1 === errorLine ? { color: "var(--editor-err)", fontWeight: 700 } : undefined}>
              {i + 1}
            </div>
          ))}
        </div>
        <div className="relative flex-1 min-w-0">
          <pre
            ref={preRef}
            aria-hidden="true"
            className="m-0 py-3.5 px-4 font-mono text-[13.5px] leading-[1.65] whitespace-pre overflow-hidden absolute inset-0 pointer-events-none"
            style={{ color: "var(--editor-ink)" }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          <textarea
            ref={taRef}
            value={value}
            onChange={handleChange}
            onScroll={syncScrollX}
            onKeyDown={handleKeyDown}
            onClick={() => setPopup(null)}
            onBlur={() => setPopup(null)}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            wrap="off"
            rows={lineCount}
            aria-autocomplete="list"
            aria-controls={popup ? listId : undefined}
            aria-activedescendant={activeId}
            aria-invalid={diagnostic ? true : undefined}
            className="relative block m-0 py-3.5 px-4 font-mono text-[13.5px] leading-[1.65] whitespace-pre w-full resize-none outline-none border-none bg-transparent"
            style={{ color: "transparent", caretColor: "var(--editor-ink)" }}
          />
        </div>
      </div>

      {/* Symbol bar: at the bottom of the editor, right under the code — above the error message,
          which comes and goes while typing and would otherwise make the buttons jump. */}
      <div
        role="toolbar"
        aria-label="Symboles"
        // preventDefault keeps the focus (and the phone keyboard) in the editor.
        onMouseDown={(e) => e.preventDefault()}
        className="flex gap-1 overflow-x-auto px-2 py-1.5 border-t [scrollbar-width:none]"
        style={{ borderColor: "var(--editor-line)" }}
      >
        {(SYMBOLS[lang] ?? SYMBOLS.python).map((key) => (
          <button
            key={key.insert}
            type="button"
            tabIndex={-1}
            onClick={() => insertSymbol(key)}
            title={key.name}
            aria-label={key.name}
            className="flex-none min-w-[34px] h-[30px] px-2 rounded-md font-mono text-[14px] cursor-pointer border"
            style={{ color: "var(--editor-ink)", borderColor: "var(--editor-line)", background: "rgba(236, 232, 245, 0.05)" }}
          >
            {key.label ?? key.insert}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {diagnostic && (
          <button
            type="button"
            onClick={goToErrorLine}
            className="w-full flex items-start gap-2 border-t px-3.5 py-2 text-left font-mono text-[12.5px] leading-snug cursor-pointer"
            style={{ borderColor: "var(--editor-line)", color: "var(--editor-err)", background: "transparent" }}
            title={errorLine ? "Aller à la ligne" : undefined}
          >
            <span aria-hidden="true">⚠</span>
            <span>
              {errorLine ? <strong>Ligne {errorLine} — </strong> : null}
              {diagnostic.message}
            </span>
          </button>
        )}
      </div>

      {popup &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label="Suggestions"
            onMouseDown={(e) => e.preventDefault() /* keep focus (and the caret) in the editor */}
            className="fixed z-[200] m-0 p-1 list-none overflow-y-auto rounded-lg border font-mono text-[13px]"
            style={{
              left: Math.max(8, Math.min(popup.left - 4, window.innerWidth - POPUP_WIDTH - 8)),
              ...(placeAbove ? { bottom: window.innerHeight - popup.lineTop + 2 } : { top: popup.lineBottom + 2 }),
              width: POPUP_WIDTH,
              maxWidth: "calc(100vw - 16px)",
              maxHeight: POPUP_MAX_HEIGHT,
              background: "var(--editor-bg)",
              borderColor: "var(--editor-line)",
              color: "var(--editor-ink)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            {popup.items.map((item, i) => {
              const badge = KIND_BADGE[item.kind];
              const selected = i === popup.selected;
              return (
                <li
                  key={`${item.label}-${i}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setPopup((p) => (p ? { ...p, selected: i } : p))}
                  onClick={() => accept(item)}
                  className="flex items-center gap-2 rounded-md px-2 py-1 cursor-pointer"
                  style={selected ? { background: "rgba(236, 232, 245, 0.10)" } : undefined}
                >
                  <span
                    aria-label={badge.name}
                    className="flex-none w-[22px] text-center text-[11px] font-bold rounded"
                    style={{ color: badge.color, border: `1px solid ${badge.color}`, opacity: 0.9 }}
                  >
                    {badge.glyph}
                  </span>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.detail && (
                    <span className="ml-auto pl-2 truncate font-body text-[11.5px]" style={{ color: "var(--editor-ink-soft)" }}>
                      {item.detail}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
