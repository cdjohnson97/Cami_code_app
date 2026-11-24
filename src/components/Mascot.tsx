"use client";

import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { MascotMood } from "@/lib/types";

// Heavy (three.js), so it is fetched only when a big mascot is actually rendered.
const Mascot3D = lazy(() => import("./mascot3d/Mascot3D"));

const MOUTHS: Record<MascotMood, string> = {
  idle: "M -9 8 Q 0 15 9 8",
  happy: "M -11 6 Q 0 20 11 6",
  wink: "M -11 6 Q 0 20 11 6",
  celebrate: "M -12 5 Q 0 22 12 5",
  think: "M -8 10 Q 0 10 8 10",
  wave: "M -11 6 Q 0 20 11 6",
  coding: "M -8 8 Q 0 14 8 8",
  idea: "M -7 6 Q 0 19 7 6",
  curious: "M -8 11 Q -2 6 7 10",
  victory: "M -13 4 Q 0 24 13 4",
};

export const MASCOT_BUBBLES: Record<MascotMood, string[]> = {
  idle: [
    "Tu gères 👏", "On avance !", "J'adore coder avec toi", "Encore un peu de courage",
    "Tu vas y arriver", "Petit à petit...", "Merci de m'aider !",
  ],
  happy: ["Super boulot !", "On forme une bonne équipe !", "Continuons comme ça ! ✨"],
  wink: ["Tu as le truc !", "C'est dans la poche 😉", "Bien joué !"],
  celebrate: ["OUIII ! 🎉", "Champiooon !", "Tu as réussi !", "Victoire ! 🏆"],
  think: ["Hmm, réfléchissons...", "Quelle est la logique ?", "Analysons pas à pas..."],
  wave: ["Salut à toi !", "Prêt·e à coder ?", "Bienvenue ! 👋"],
  coding: ["Ça code dur ici !", "J'adore la syntaxe !", "Bip boup, compilation en cours... 💻"],
  idea: ["Eurêka ! 💡", "Et si on essayait ça ?", "J'ai une piste pour toi !"],
  curious: ["Tiens, que s'est-il passé ?", "Un petit bug ? On va le trouver ensemble ! 🔍"],
  victory: ["Incroyable ! 🌟", "Tu as tout déchiré !", "Mission accomplie ! 🚀"],
};

function MascotSVG({
  mood = "idle",
  size = 64,
  pokeKey = 0,
}: {
  mood?: MascotMood;
  size?: number;
  pokeKey?: number;
}) {
  const isWave = mood === "wave";
  const isVictory = mood === "victory" || mood === "celebrate";
  const isCoding = mood === "coding";
  const isIdea = mood === "idea";
  const isCurious = mood === "curious";
  const isHappy = mood === "happy" || isVictory;

  const leftEye = useMemo(() => {
    if (mood === "wink") {
      return <path d="M -14 -6 Q -8 -2 -2 -6" stroke="var(--m-eye)" strokeWidth={3.2} fill="none" strokeLinecap="round" />;
    }
    if (isVictory) {
      // Star eye for victory
      return (
        <path
          d="M -8 -11 L -6.5 -7.5 L -3 -7 L -5.5 -4.5 L -5 -1 L -8 -3 L -11 -1 L -10.5 -4.5 L -13 -7 L -9.5 -7.5 Z"
          fill="var(--accent)"
        />
      );
    }
    if (isCoding) {
      // Focused eye
      return (
        <>
          <ellipse cx={-8} cy={-6} rx={5} ry={3.8} fill="var(--m-eye)" />
          <motion.circle
            cx={-7} cy={-6} r={1.6} fill="var(--m-pupil)"
            animate={{ x: [-1.2, 1.2, -1.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      );
    }
    return (
      <>
        <circle cx={-8} cy={-6} r={isIdea ? 5.8 : 5} fill="var(--m-eye)" />
        <motion.circle
          cx={-7} cy={-7} r={isIdea ? 2 : 1.6} fill="var(--m-pupil)"
          animate={{ x: [0, 0, 1.4, -1.4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.75, 0.82, 0.9, 1] }}
        />
      </>
    );
  }, [mood, isVictory, isCoding, isIdea]);

  const rightEye = useMemo(() => {
    if (isVictory) {
      return (
        <path
          d="M 8 -11 L 9.5 -7.5 L 13 -7 L 10.5 -4.5 L 11 -1 L 8 -3 L 5 -1 L 5.5 -4.5 L 3 -7 L 6.5 -7.5 Z"
          fill="var(--accent)"
        />
      );
    }
    if (isCoding) {
      return (
        <>
          <ellipse cx={8} cy={-6} rx={5} ry={3.8} fill="var(--m-eye)" />
          <motion.circle
            cx={9} cy={-6} r={1.6} fill="var(--m-pupil)"
            animate={{ x: [-1.2, 1.2, -1.2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      );
    }
    return (
      <>
        <circle cx={8} cy={-6} r={isIdea ? 5.8 : 5} fill="var(--m-eye)" />
        <motion.circle
          cx={9} cy={-7} r={isIdea ? 2 : 1.6} fill="var(--m-pupil)"
          animate={{ x: [0, 0, 1.4, -1.4, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.75, 0.82, 0.9, 1] }}
        />
      </>
    );
  }, [isVictory, isCoding, isIdea]);

  return (
    <motion.div
        key={pokeKey}
        initial={pokeKey ? { scale: 1 } : false}
        animate={
          pokeKey
            ? { scale: [1, 0.88, 1.12, 0.96, 1], rotate: [0, -6, 6, -3, 0] }
            : isVictory
            ? { y: [0, -9, 0, -5, 0] }
            : {}
        }
        transition={
          pokeKey
            ? { duration: 0.55, ease: "easeOut" }
            : isVictory
            ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            : {}
        }
      >
        <motion.svg
          viewBox="-40 -50 80 96"
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          animate={{
            y: isCoding ? [0, -2, 0] : isIdea ? [0, -6, 0] : [0, -4, 0],
            rotate: isCurious ? [4, 9, 4] : [0, 0, 0],
          }}
          transition={{
            duration: isCoding ? 2 : isIdea ? 2.2 : 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Ombre portée dynamique au sol */}
          <motion.ellipse
            cx={0}
            cy={42}
            rx={isVictory ? 15 : 19}
            ry={4}
            fill="rgba(0,0,0,0.13)"
            animate={isVictory ? { scale: [1, 0.65, 1], opacity: [0.15, 0.08, 0.15] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Effet spécial : Ampoule brillante au-dessus de la tête si mood == 'idea' */}
          {isIdea && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.15, 1], opacity: 1 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <circle cx={0} cy={-46} r={7} fill="#FACC15" />
              <path d="M -3 -40 L 3 -40" stroke="#EAB308" strokeWidth={2} strokeLinecap="round" />
              {/* Rayons lumineux */}
              <line x1={-10} y1={-53} x2={-13} y2={-56} stroke="#FACC15" strokeWidth={1.8} strokeLinecap="round" />
              <line x1={10} y1={-53} x2={13} y2={-56} stroke="#FACC15" strokeWidth={1.8} strokeLinecap="round" />
              <line x1={0} y1={-56} x2={0} y2={-60} stroke="#FACC15" strokeWidth={1.8} strokeLinecap="round" />
            </motion.g>
          )}

          {/* Bras gauche */}
          <motion.rect
            x={-30}
            y={-4}
            width={10}
            height={20}
            rx={5}
            fill="var(--m-body)"
            style={{ transformBox: "fill-box", transformOrigin: "top left" }}
            animate={
              isVictory
                ? { y: [-24, -30, -24], rotate: [0, 35, 0] }
                : isCoding
                ? { y: [-6, -2, -6], rotate: [8, -8, 8] }
                : isCurious
                ? { y: -16, rotate: 25 }
                : { y: -4, rotate: 0 }
            }
            transition={{
              duration: isCoding ? 0.6 : isVictory ? 1 : 0.4,
              repeat: isCoding || isVictory ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Bras droit */}
          <motion.rect
            x={20}
            y={-4}
            width={10}
            height={20}
            rx={5}
            fill="var(--m-body)"
            style={{ transformBox: "fill-box", transformOrigin: "top right" }}
            animate={
              isWave
                ? { y: -32, rotate: [0, -32, 10, -32, 10, -32, 0] }
                : isVictory
                ? { y: [-24, -30, -24], rotate: [0, -35, 0] }
                : isCoding
                ? { y: [-2, -6, -2], rotate: [-8, 8, -8] }
                : isHappy
                ? { y: [-28, -32, -28], rotate: [0, -20, 0] }
                : { y: -4, rotate: 0 }
            }
            transition={{
              duration: isWave ? 1.4 : isCoding ? 0.6 : isVictory || isHappy ? 1 : 0.3,
              repeat: isWave || isCoding || isVictory || isHappy ? Infinity : 0,
              ease: "easeInOut",
            }}
          />

          {/* Corps principal */}
          <g>
            <rect x={-24} y={-30} width={48} height={52} rx={20} fill="var(--m-body)" />

            {/* Antenne */}
            <line x1={0} y1={-30} x2={0} y2={-38} stroke="var(--m-body)" strokeWidth={3} />
            <motion.circle
              cx={0}
              cy={-40}
              r={4}
              fill="var(--m-accent2)"
              animate={isIdea ? { scale: [1, 1.4, 1] } : isCoding ? { fill: ["var(--m-accent2)", "var(--accent)", "var(--m-accent2)"] } : {}}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Ondes radio si en train de coder */}
            {isCoding && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <path d="M -8 -45 Q 0 -50 8 -45" stroke="var(--accent)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                <path d="M -12 -49 Q 0 -56 12 -49" stroke="var(--accent)" strokeWidth={1.5} fill="none" strokeLinecap="round" />
              </motion.g>
            )}

            {/* Yeux */}
            <g>
              {leftEye}
              {rightEye}
            </g>

            {/* Bouche interactive */}
            <motion.path
              initial={false}
              animate={{ d: MOUTHS[mood] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              d={MOUTHS[mood]}
              stroke="var(--m-eye)"
              strokeWidth={3.2}
              fill="none"
              strokeLinecap="round"
            />
          </g>

          {/* Accessoire loupe si en mode curieux */}
          {isCurious && (
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <circle cx={-18} cy={-2} r={7} stroke="#475569" strokeWidth={2.2} fill="rgba(255,255,255,0.4)" />
              <line x1={-23} y1={3} x2={-29} y2={9} stroke="#475569" strokeWidth={2.5} strokeLinecap="round" />
            </motion.g>
          )}
        </motion.svg>
    </motion.div>
  );
}

export type MascotProps = {
  mood?: MascotMood;
  size?: number;
  interactive?: boolean;
  className?: string;
  speechBubble?: string;
  /**
   * "auto" (default) shows the 3D character when it is big enough and WebGL is
   * available; smaller instances keep the lightweight SVG (progress bar, map…).
   */
  variant?: "auto" | "2d" | "3d";
  /** Forces the walk cycle on the 3D character (chapter transition, splash entrance). */
  walking?: boolean;
};

/** If WebGL throws (context lost, driver bug…), fall back to the SVG mascot. */
class Mascot3DBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// One idle prefetch for the whole page, however many mascots are mounted.
let mascot3DRequested = false;

export function Mascot({
  mood = "idle",
  size = 64,
  interactive = true,
  className = "",
  speechBubble,
  variant = "auto",
  walking = false,
}: MascotProps) {
  const [bubble, setBubble] = useState<string | null>(null);
  const [pokeKey, setPokeKey] = useState(0);
  const [webgl, setWebgl] = useState(false);
  const reduced = useReducedMotion();
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setWebgl(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
    return () => {
      if (timeout.current) window.clearTimeout(timeout.current);
    };
  }, []);

  // Warm the 3D chunk while the browser is idle: the chapter transition and the splash then
  // don't have to download three.js mid-animation (the SVG stays on screen until it is ready).
  useEffect(() => {
    if (!webgl || mascot3DRequested) return;
    mascot3DRequested = true;
    const load = () => void import("./mascot3d/Mascot3D");
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(load, { timeout: 3000 });
    } else {
      window.setTimeout(load, 1200);
    }
  }, [webgl]);

  function handleClick() {
    if (!interactive) return;
    setPokeKey((k) => k + 1);
    const pool = MASCOT_BUBBLES[mood] || MASCOT_BUBBLES.idle;
    setBubble(pool[(Math.random() * pool.length) | 0]);
    if (timeout.current) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setBubble(null), 2400);
  }

  const use3D = webgl && variant !== "2d" && (variant === "3d" || size >= 76);
  const activeBubble = speechBubble ?? bubble;
  const fallback = <MascotSVG mood={mood} size={size} pokeKey={pokeKey} />;

  return (
    <div
      className={`relative inline-block leading-none select-none ${interactive ? "cursor-pointer" : ""} ${className}`}
      onClick={handleClick}
      title={interactive ? "Clique sur moi !" : undefined}
    >
      <AnimatePresence>
        {activeBubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 whitespace-nowrap rounded-[12px] border px-3.5 py-1.5 text-xs font-semibold z-20"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line)",
              color: "var(--ink)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {activeBubble}
            {/* Petit triangle de la bulle de BD */}
            <span
              className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent"
              style={{ borderTopColor: "var(--paper)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {use3D ? (
        <Mascot3DBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Mascot3D mood={mood} size={size} interactive={interactive} pokeKey={pokeKey} reduced={!!reduced} walking={walking} />
          </Suspense>
        </Mascot3DBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
