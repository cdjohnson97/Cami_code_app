"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number; y: number; vx: number; vy: number; g: number;
  rot: number; vr: number; size: number; color: string; life: number; maxLife: number;
};

const COLORS = ["#F0759A", "#C13D63", "#5FD3AE", "#1E8F72", "#EBC26B", "#8FC6E8", "#F2A6C6"];

/** Mount once; call `.fire()` via the returned ref-callback pattern by bumping `token`. */
export function Confetti({ token }: { token: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const list: Particle[] = [];
    for (let i = 0; i < 70; i++) {
      list.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: 2 + Math.random() * 2.5,
        g: 0.04 + Math.random() * 0.05,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        size: 5 + Math.random() * 4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        maxLife: 240 + Math.random() * 100,
      });
    }
    particlesRef.current = list;

    function step() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particlesRef.current.forEach((p) => { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++; });
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife && p.y < window.innerHeight + 40);
      particlesRef.current.forEach((p) => {
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      });
      if (particlesRef.current.length) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [token]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[90]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
