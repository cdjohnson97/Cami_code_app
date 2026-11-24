"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { MascotMood } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useResolvedTheme } from "@/lib/theme";

export type Mascot3DProps = {
  mood: MascotMood;
  size: number;
  interactive: boolean;
  /** Incremented by the wrapper on every click; restarts the jump. */
  pokeKey: number;
  /** prefers-reduced-motion: keep the character still (expressions still change). */
  reduced: boolean;
  /** Forces the walk cycle (chapter transition, splash entrance). */
  walking?: boolean;
};

type Palette = {
  body: string;
  bodyShade: string;
  eye: string;
  pupil: string;
  accent: string;
  cheek: string;
};

const LIGHT: Palette = {
  body: "#C13D63",
  bodyShade: "#9E2C4D",
  eye: "#FFFFFF",
  pupil: "#26202F",
  accent: "#1E8F72",
  cheek: "#F0759A",
};

const DARK: Palette = {
  body: "#F0759A",
  bodyShade: "#C9547C",
  eye: "#FFFFFF",
  pupil: "#211129",
  accent: "#5FD3AE",
  cheek: "#FFB3C8",
};

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;

export default function Mascot3D({ mood, size, interactive, pokeKey, reduced, walking = false }: Mascot3DProps) {
  const theme = useAppStore((s) => s.theme);
  const resolved = useResolvedTheme(theme);
  const palette = resolved === "dark" ? DARK : LIGHT;

  // Freeze the render loop while the character is scrolled out of view: one RAF per
  // visible mascot is fine, but several offscreen canvases are pure battery drain.
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} style={{ width: size, height: size }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.75]}
        flat
        camera={{ position: [0, 0.12, 5.7], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", pointerEvents: interactive ? "auto" : "none" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        aria-hidden="true"
      >
        <ambientLight intensity={0.85} />
        <hemisphereLight args={["#FFFFFF", palette.cheek, 0.55]} />
        <directionalLight position={[2.5, 4, 3.5]} intensity={2.1} />
        <directionalLight position={[-3, 1.5, 2]} intensity={0.85} color="#FFD1E0" />
        <pointLight position={[0, 0.4, 3]} intensity={0.7} />
        <CaMI mood={mood} interactive={interactive} pokeKey={pokeKey} reduced={reduced} walking={walking} palette={palette} />
      </Canvas>
    </div>
  );
}

function CaMI({
  mood,
  interactive,
  pokeKey,
  reduced,
  walking = false,
  palette,
}: {
  mood: MascotMood;
  interactive: boolean;
  pokeKey: number;
  reduced: boolean;
  walking?: boolean;
  palette: Palette;
}) {
  const root = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Group>(null!);
  const eyeR = useRef<THREE.Group>(null!);
  const pupilL = useRef<THREE.Mesh>(null!);
  const pupilR = useRef<THREE.Mesh>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Group>(null!);
  const legR = useRef<THREE.Group>(null!);
  const antenna = useRef<THREE.Group>(null!);
  const bulbMaterial = useRef<THREE.MeshStandardMaterial>(null!);
  const shadow = useRef<THREE.Mesh>(null!);
  const { gl } = useThree();

  // Pointer state, in [-1, 1] relative to the canvas.
  const pointer = useRef({ x: 0, y: 0 });
  const clockRef = useRef(0);
  const blink = useRef({ next: 2.2, closing: 0 });
  const walk = useRef({ target: 0, wait: 2.5, moving: false, dir: 1, blend: 0 });
  const jump = useRef({ t: -1, y: 0 });

  const shadowTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
    gradient.addColorStop(0, "rgba(0,0,0,0.45)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.16)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useEffect(() => {
    if (pokeKey === 0) return;
    jump.current.t = 0;
  }, [pokeKey]);

  useEffect(() => {
    if (!interactive) return;
    const el = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointer.current.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointer.current.y = clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
    };
    const onLeave = () => {
      pointer.current.x = 0;
      pointer.current.y = 0;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [gl, interactive]);

  const celebrating = mood === "celebrate" || mood === "victory";
  const waving = mood === "wave";
  const coding = mood === "coding";
  const thinking = mood === "think";
  const curious = mood === "curious";
  const idea = mood === "idea";
  const happy = mood === "happy" || celebrating || waving;

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = (clockRef.current += delta);
    const motion = reduced ? 0 : 1;
    const p = pointer.current;
    const r = root.current;
    if (!r) return;

    // ---- Jump (click) -------------------------------------------------
    if (jump.current.t >= 0) {
      jump.current.t += delta;
      const progress = jump.current.t / 0.72;
      if (progress >= 1) {
        jump.current.t = -1;
        jump.current.y = 0;
      } else {
        jump.current.y = Math.sin(progress * Math.PI) * 0.26;
      }
    }

    // ---- Walk cycle: every few seconds, stroll to another spot -------
    // `walking` (transition/splash) keeps the legs going while the *wrapper* translates the
    // character across the screen: the mascot never wanders on its own in that mode.
    const w = walk.current;
    const forcedWalk = walking && !reduced;
    if (forcedWalk) {
      w.moving = false;
      w.wait = 1.4;
    } else if (motion && !celebrating && !coding) {
      if (w.moving) {
        const dx = w.target - r.position.x;
        if (Math.abs(dx) < 0.015) {
          w.moving = false;
          w.wait = 2.6 + Math.random() * 3.8;
        } else {
          w.dir = Math.sign(dx);
          r.position.x += w.dir * Math.min(Math.abs(dx), delta * 0.5);
        }
      } else {
        w.wait -= delta;
        if (w.wait <= 0) {
          const next = (Math.random() * 2 - 1) * 0.72;
          w.target = Math.abs(next - r.position.x) < 0.28 ? -next : next;
          w.moving = true;
        }
      }
    }
    w.blend = damp(w.blend, forcedWalk || w.moving ? 1 : 0, 10, delta);
    const swing = Math.sin(t * 9) * (forcedWalk ? 0.78 : 0.55) * w.blend;

    // ---- Vertical bob, celebration bounce, jump -----------------------
    const bob =
      (Math.sin(t * 1.7) * 0.018 + Math.abs(Math.sin(t * 9)) * 0.05 * w.blend) * motion +
      (celebrating ? Math.abs(Math.sin(t * 3.1)) * 0.13 * motion : 0);
    r.position.y = damp(r.position.y, bob + jump.current.y, 14, delta);
    r.rotation.y = damp(
      r.rotation.y,
      forcedWalk ? Math.sin(t * 4.5) * 0.12 : w.moving ? w.dir * 0.22 : 0,
      8,
      delta,
    );

    // ---- Head: look at the pointer, tilt with the mood ----------------
    const gazeY = reduced ? 0 : p.x * 0.42;
    const gazeX = reduced ? 0 : -p.y * 0.22;
    const tilt = thinking ? 0.16 : curious ? 0.13 : idea ? -0.06 : 0;
    head.current.rotation.y = damp(head.current.rotation.y, gazeY, 7, delta);
    head.current.rotation.x = damp(head.current.rotation.x, gazeX + (thinking ? 0.08 : 0), 7, delta);
    head.current.rotation.z = damp(head.current.rotation.z, tilt * motion, 6, delta);

    // ---- Eyes: gaze offset + blink ------------------------------------
    blink.current.next -= delta;
    if (blink.current.next <= 0) {
      blink.current.next = 2.4 + Math.random() * 3.6;
      blink.current.closing = 0.14;
    }
    if (blink.current.closing > 0) blink.current.closing -= delta;

    let openL = 1;
    let openR = 1;
    if (mood === "wink") openR = 0.08;
    if (celebrating) {
      openL = 0.55;
      openR = 0.55;
    }
    if (coding) {
      openL = 0.66;
      openR = 0.66;
    }
    if (idea) {
      openL = 1.18;
      openR = 1.18;
    }
    if (blink.current.closing > 0) {
      openL = 0.08;
      openR = 0.08;
    }
    eyeL.current.scale.y = damp(eyeL.current.scale.y, openL, 22, delta);
    eyeR.current.scale.y = damp(eyeR.current.scale.y, openR, 22, delta);

    const lookX = reduced ? 0 : p.x * 0.028;
    const lookY = reduced ? 0 : p.y * 0.02;
    pupilL.current.position.x = lookX;
    pupilL.current.position.y = lookY;
    pupilR.current.position.x = lookX;
    pupilR.current.position.y = lookY;

    // ---- Arms: mood pose + walking swing ------------------------------
    let targetZL = -0.2;
    let targetZR = 0.2;
    let targetXL = 0;
    let targetXR = 0;
    if (waving) {
      targetZR = 2.35 + Math.sin(t * 7) * 0.22 * motion;
      targetXR = -0.15;
    }
    if (celebrating) {
      targetZL = -2.35 - Math.sin(t * 6) * 0.18 * motion;
      targetZR = 2.35 + Math.sin(t * 6) * 0.18 * motion;
    }
    if (coding) {
      targetXL = -1.15;
      targetXR = -1.15;
      targetZL = -0.12;
      targetZR = 0.12;
    }
    if (thinking) {
      targetXR = -0.7;
      targetZR = 1.05;
    }
    if (curious) {
      targetZL = -0.62;
    }
    if (happy && !celebrating && !waving) {
      targetZL = -0.36;
      targetZR = 0.36;
    }
    const armSwingL = -swing * 0.7;
    const armSwingR = swing * 0.7;
    armL.current.rotation.z = damp(armL.current.rotation.z, targetZL, 10, delta);
    armR.current.rotation.z = damp(armR.current.rotation.z, targetZR, 10, delta);
    armL.current.rotation.x = damp(armL.current.rotation.x, targetXL + armSwingL, 14, delta);
    armR.current.rotation.x = damp(armR.current.rotation.x, targetXR + armSwingR, 14, delta);

    // ---- Legs ----------------------------------------------------------
    legL.current.rotation.x = damp(legL.current.rotation.x, swing, 18, delta);
    legR.current.rotation.x = damp(legR.current.rotation.x, -swing, 18, delta);

    // ---- Antenna wobble + glow ----------------------------------------
    antenna.current.rotation.z = Math.sin(t * 2.2) * 0.09 * motion + (w.moving ? w.dir * 0.12 : 0);
    antenna.current.rotation.x = Math.sin(t * 1.6) * 0.05 * motion;
    const glow = idea ? 1.6 + Math.sin(t * 7) * 0.5 : celebrating ? 1.1 : 0.45;
    bulbMaterial.current.emissiveIntensity = damp(bulbMaterial.current.emissiveIntensity, glow, 8, delta);

    // ---- Ground shadow shrinks when the character is in the air -------
    const lift = jump.current.y + (celebrating ? Math.abs(Math.sin(t * 3.1)) * 0.13 : 0);
    const scale = 1 - lift * 0.9;
    shadow.current.scale.set(scale, scale, 1);
  });

  return (
    <group ref={root} position={[0, 0, 0]}>
      {/* soft contact shadow */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.32, 0.05]}>
        <planeGeometry args={[1.55, 1.0]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>

      {/* legs */}
      <group ref={legL} position={[-0.26, -0.72, 0]}>
        <RoundedBox args={[0.28, 0.42, 0.3]} radius={0.12} smoothness={4} position={[0, -0.21, 0]}>
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.16, 0.48]} radius={0.07} smoothness={4} position={[0, -0.46, 0.07]}>
          <meshStandardMaterial color={palette.body} roughness={0.45} />
        </RoundedBox>
      </group>
      <group ref={legR} position={[0.26, -0.72, 0]}>
        <RoundedBox args={[0.28, 0.42, 0.3]} radius={0.12} smoothness={4} position={[0, -0.21, 0]}>
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.36, 0.16, 0.48]} radius={0.07} smoothness={4} position={[0, -0.46, 0.07]}>
          <meshStandardMaterial color={palette.body} roughness={0.45} />
        </RoundedBox>
      </group>

      {/* body */}
      <RoundedBox args={[0.94, 0.9, 0.7]} radius={0.3} smoothness={6} position={[0, -0.3, 0]}>
        <meshStandardMaterial color={palette.body} roughness={0.42} metalness={0.04} />
      </RoundedBox>
      {/* chest light */}
      <mesh position={[0, -0.24, 0.36]}>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color={palette.accent} emissive={palette.accent} emissiveIntensity={0.35} roughness={0.3} />
      </mesh>

      {/* arms */}
      <group ref={armL} position={[-0.56, -0.12, 0]}>
        <RoundedBox args={[0.22, 0.5, 0.24]} radius={0.1} smoothness={4} position={[0, -0.2, 0]}>
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, -0.47, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={palette.body} roughness={0.45} />
        </mesh>
      </group>
      <group ref={armR} position={[0.56, -0.12, 0]}>
        <RoundedBox args={[0.22, 0.5, 0.24]} radius={0.1} smoothness={4} position={[0, -0.2, 0]}>
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, -0.47, 0]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={palette.body} roughness={0.45} />
        </mesh>
      </group>

      {/* head */}
      <group ref={head} position={[0, 0.5, 0]}>
        <RoundedBox args={[1.5, 1.2, 1.0]} radius={0.4} smoothness={6}>
          <meshStandardMaterial color={palette.body} roughness={0.38} metalness={0.05} />
        </RoundedBox>

        {/* ears */}
        <mesh position={[-0.79, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 20]} />
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </mesh>
        <mesh position={[0.79, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.14, 20]} />
          <meshStandardMaterial color={palette.bodyShade} roughness={0.5} />
        </mesh>

        {/* eyes */}
        <group ref={eyeL} position={[-0.3, 0.12, 0.48]}>
          <mesh scale={[1, 1.12, 0.55]}>
            <sphereGeometry args={[0.19, 24, 24]} />
            <meshStandardMaterial color={palette.eye} roughness={0.25} />
          </mesh>
          <mesh ref={pupilL} position={[0, 0, 0.11]}>
            <sphereGeometry args={[0.088, 20, 20]} />
            <meshStandardMaterial color={palette.pupil} roughness={0.3} />
          </mesh>
          <mesh position={[0.035, 0.04, 0.15]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>
        <group ref={eyeR} position={[0.3, 0.12, 0.48]}>
          <mesh scale={[1, 1.12, 0.55]}>
            <sphereGeometry args={[0.19, 24, 24]} />
            <meshStandardMaterial color={palette.eye} roughness={0.25} />
          </mesh>
          <mesh ref={pupilR} position={[0, 0, 0.11]}>
            <sphereGeometry args={[0.088, 20, 20]} />
            <meshStandardMaterial color={palette.pupil} roughness={0.3} />
          </mesh>
          <mesh position={[0.035, 0.04, 0.15]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
        </group>

        {/* cheeks */}
        <mesh position={[-0.52, -0.14, 0.44]} scale={[1, 0.62, 0.3]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color={palette.cheek} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0.52, -0.14, 0.44]} scale={[1, 0.62, 0.3]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color={palette.cheek} transparent opacity={0.5} />
        </mesh>

        <Mouth mood={mood} color={palette.pupil} />

        {/* antenna */}
        <group ref={antenna} position={[0, 0.62, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.4, 10]} />
            <meshStandardMaterial color={palette.bodyShade} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.43, 0]}>
            <sphereGeometry args={[0.1, 18, 18]} />
            <meshStandardMaterial
              ref={bulbMaterial}
              color={palette.accent}
              emissive={palette.accent}
              emissiveIntensity={0.5}
              roughness={0.25}
            />
          </mesh>
          {idea && (
            <pointLight position={[0, 0.43, 0.2]} intensity={1.4} distance={2.2} color={palette.accent} />
          )}
        </group>
      </group>
    </group>
  );
}

/** Torus arc (or a small bar) that changes shape with the mood. */
function Mouth({ mood, color }: { mood: MascotMood; color: string }) {
  const base = { y: -0.18, z: 0.51 };

  if (mood === "think") {
    return (
      <mesh position={[0, base.y + 0.03, base.z]}>
        <boxGeometry args={[0.24, 0.035, 0.035]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    );
  }

  if (mood === "idea") {
    return (
      <mesh position={[0, base.y + 0.02, base.z]}>
        <torusGeometry args={[0.075, 0.032, 12, 28]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    );
  }

  let radius = 0.2;
  let arc = Math.PI * 0.72;
  let tilt = 0;

  if (mood === "happy" || mood === "wave") arc = Math.PI * 0.88;
  if (mood === "celebrate" || mood === "victory") {
    radius = 0.22;
    arc = Math.PI * 0.98;
  }
  if (mood === "coding") arc = Math.PI * 0.5;
  if (mood === "curious") {
    arc = Math.PI * 0.5;
    tilt = 0.14;
  }
  if (mood === "wink") {
    arc = Math.PI * 0.4;
    tilt = 0.18;
  }

  const thetaStart = Math.PI + (Math.PI - arc) / 2;

  return (
    <mesh position={[0, base.y + 0.03, base.z]} rotation={[0, 0, thetaStart + tilt]}>
      <torusGeometry args={[radius, 0.038, 12, 40, arc]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}
