"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mascot } from "./Mascot";

// Launch screen: shown once per app launch (per browser session — not on every navigation or
// reload), over the app while it finishes loading, then it fades away onto the page.

const SESSION_KEY = "cami_splash_shown";
const MIN_DURATION_MS = 1900;
const MIN_DURATION_REDUCED_MS = 500;

export function shouldShowSplash(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

const LETTERS = ["C", "a", "M", "I"];

export function SplashScreen({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduced = useReducedMotion();
  const minDuration = reduced ? MIN_DURATION_REDUCED_MS : MIN_DURATION_MS;
  const [minElapsed, setMinElapsed] = useState(false);
  // CaMI walks in from the left, then stops and waves while the wordmark settles.
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMinElapsed(true), minDuration);
    return () => window.clearTimeout(t);
  }, [minDuration]);

  useEffect(() => {
    if (reduced) {
      setArrived(true);
      return;
    }
    const t = window.setTimeout(() => setArrived(true), 950);
    return () => window.clearTimeout(t);
  }, [reduced]);

  // Leave once the animation has played AND the app behind is ready (state restored).
  useEffect(() => {
    if (!minElapsed || !ready) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // storage unavailable: the splash will simply show again next time
    }
    onDone();
  }, [minElapsed, ready, onDone]);

  return (
    <motion.div
      role="status"
      aria-label="Chargement de CaMI"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
      transition={{ duration: reduced ? 0.2 : 0.45, ease: "easeInOut" }}
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      {/* Entrance: CaMI walks in from the left (legs animated by the 3D walk cycle), then waves. */}
      <motion.div
        initial={reduced ? false : { opacity: 0, x: -180 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.95, ease: [0.3, 0, 0.2, 1] }}
      >
        <Mascot
          mood={arrived ? "wave" : "happy"}
          size={128}
          interactive={false}
          variant="3d"
          walking={!arrived && !reduced}
        />
      </motion.div>

      <div className="font-display text-[44px] font-bold tracking-tight leading-none flex mt-4" aria-hidden="true">
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            initial={reduced ? false : { opacity: 0, y: 18, rotate: -12 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14, delay: reduced ? 0 : 1 + i * 0.09 }}
            style={i >= 2 ? { color: "var(--accent)" } : { color: "var(--ink)" }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduced ? 0 : 1.5, duration: 0.4 }}
        className="font-mono text-[12px] tracking-wide uppercase font-semibold mt-5 text-center"
        style={{ color: "var(--accent)" }}
      >
        ton copilote pour apprendre à coder
      </motion.p>

      <div className="w-[140px] h-[5px] rounded-full overflow-hidden mt-8" style={{ background: "var(--line)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--accent)" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: minDuration / 1000, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
