// Thin typed wrapper around algoEngineCore.js — the hand-rolled French-pseudocode / Python-subset
// interpreter, ported unchanged from the original single-file CaMI app. It is plain, dynamically
// typed JS on purpose: it was already tested exhaustively (49 engine unit tests + 109 exercise
// checks) in that form, and re-typing it in strict TypeScript would risk introducing regressions
// for no real benefit — it's an internal engine, not a public API surface.
// @ts-nocheck
import AlgoEngineCore from "./algoEngineCore.js";

export type EngineError = { message: string; line: number | null };
export type RunResult = {
  success: boolean;
  output: string[];
  globals: Record<string, unknown>;
  error: EngineError | null;
  trace?: unknown[];
};

export const runPython: (source: string, opts?: unknown) => RunResult = AlgoEngineCore.runPython;
export const runPseudo: (source: string, opts?: unknown) => RunResult = AlgoEngineCore.runPseudo;
export const fmt: (v: unknown) => string = AlgoEngineCore.fmt;

const AlgoEngine = { runPython, runPseudo, fmt };
export default AlgoEngine;
