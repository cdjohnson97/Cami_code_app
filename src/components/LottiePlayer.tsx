"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

// lottie-web is browser-only and heavy: load it only when an animation is on screen.
const Lottie = dynamic(() => import("lottie-react").then((mod) => mod.Lottie), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

export function LottiePlayer({
  src,
  label,
  className = "",
  loop = true,
}: {
  /** Path under /public, e.g. "/lottie/chatbot.json". */
  src: string;
  /** Describes the animation for screen readers. */
  label: string;
  className?: string;
  loop?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <div className={className} role="img" aria-label={label}>
      <Lottie src={src} autoplay loop={loop && !reduced} className="h-full w-full" />
    </div>
  );
}
