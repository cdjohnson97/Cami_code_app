"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MascotMood } from "@/lib/types";

const MOUTHS: Record<MascotMood, string> = {
  idle: "M -9 8 Q 0 15 9 8",
  happy: "M -11 6 Q 0 20 11 6",
  wink: "M -11 6 Q 0 20 11 6",
  celebrate: "M -12 5 Q 0 22 12 5",
  think: "M -8 10 Q 0 10 8 10",
  wave: "M -11 6 Q 0 20 11 6",
};

export const MASCOT_BUBBLES = [
  "Tu gères 👏", "On avance !", "J'adore coder avec toi", "Encore un peu de courage",
  "Tu vas y arriver", "Petit à petit...", "Merci de m'aider !",
];

export function Mascot({
  mood = "idle",
  size = 64,
  interactive = true,
  className = "",
}: {
  mood?: MascotMood;
  size?: number;
  interactive?: boolean;
  className?: string;
}) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [pokeKey, setPokeKey] = useState(0);
  const armLift = mood === "celebrate" || mood === "happy" || mood === "wave";
  const isWave = mood === "wave";

  const leftEye = useMemo(
    () =>
      mood === "wink" ? (
        <path d="M -14 -6 Q -8 -2 -2 -6" stroke="var(--m-eye)" strokeWidth={3} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <circle cx={-8} cy={-6} r={5} fill="var(--m-eye)" />
          <motion.circle
            cx={-7} cy={-7} r={1.6} fill="var(--m-pupil)"
            animate={{ x: [0, 0, 1.4, -1.4, 0] }}
            transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.85, 0.9, 1] }}
          />
        </>
      ),
    [mood]
  );

  function handleClick() {
    if (!interactive) return;
    setPokeKey((k) => k + 1);
    setBubble(MASCOT_BUBBLES[(Math.random() * MASCOT_BUBBLES.length) | 0]);
    window.setTimeout(() => setBubble(null), 2200);
  }

  return (
    <div className={`relative inline-block leading-none ${interactive ? "cursor-pointer" : ""} ${className}`} onClick={handleClick}>
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-[10px] border px-3 py-1.5 text-xs z-10"
            style={{ background: "var(--paper)", borderColor: "var(--line)", color: "var(--ink)", boxShadow: "var(--shadow)" }}
          >
            {bubble}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        key={pokeKey}
        initial={pokeKey ? { scale: 1 } : false}
        animate={pokeKey ? { scale: [1, 0.92, 1.06, 1] } : {}}
        transition={{ duration: 0.5, times: [0, 0.3, 0.6, 1] }}
      >
        <motion.svg
          viewBox="-40 -46 80 92"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx={0} cy={42} rx={19} ry={4} fill="rgba(0,0,0,0.13)" />
          <rect x={-30} y={-4} width={10} height={20} rx={5} fill="var(--m-body)" />
          <motion.rect
            x={20} width={10} height={20} rx={5} fill="var(--m-body)"
            style={{ transformBox: "fill-box", transformOrigin: "top right" }}
            animate={
              isWave
                ? { y: -32, rotate: [0, -30, 8, -30, 8, -30, 0] }
                : armLift
                ? { y: [-30, -34, -30], rotate: [0, -20, 0] }
                : { y: -4, rotate: 0 }
            }
            transition={
              isWave
                ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : armLift
                ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
            }
          />
          <g>
            <rect x={-24} y={-30} width={48} height={52} rx={20} fill="var(--m-body)" />
            <line x1={0} y1={-30} x2={0} y2={-38} stroke="var(--m-body)" strokeWidth={3} />
            <circle cx={0} cy={-40} r={4} fill="var(--m-accent2)" />
            <g>{leftEye}
              <circle cx={8} cy={-6} r={5} fill="var(--m-eye)" />
              <motion.circle
                cx={9} cy={-7} r={1.6} fill="var(--m-pupil)"
                animate={{ x: [0, 0, 1.4, -1.4, 0] }}
                transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.85, 0.9, 1] }}
              />
            </g>
            <motion.path
              initial={false}
              animate={{ d: MOUTHS[mood] }}
              transition={{ duration: 0.3 }}
              d={MOUTHS[mood]}
              stroke="var(--m-eye)" strokeWidth={3} fill="none" strokeLinecap="round"
            />
          </g>
        </motion.svg>
      </motion.div>
    </div>
  );
}
