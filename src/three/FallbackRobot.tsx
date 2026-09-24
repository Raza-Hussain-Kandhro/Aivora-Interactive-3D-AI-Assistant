import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import type { BotState } from "@/types";

type Props = {
  /** Rotation target group representing the "head bone". */
  headRef: React.MutableRefObject<THREE.Object3D | null>;
  visorRef: React.MutableRefObject<THREE.MeshStandardMaterial | null>;
  onPoke: (part: "head" | "chest") => void;
};

/**
 * Procedural robot built from primitive geometries.
 * Used when no GLB is configured or when model loading fails, so the app is
 * never blank. Exposes the same head/visor refs as the rigged model.
 */
export function FallbackRobot({ headRef, visorRef, onPoke }: Props) {
  const botState = useAppStore((s) => s.botState);
  const accent = useAppStore((s) => s.accentColor);
  const body = useAppStore((s) => s.bodyColor);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const poke = useAppStore((s) => s.poke);

  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Mesh>(null);

  const pokeStart = useRef(0);
  const lastNonce = useRef(poke.nonce);
  const spin = useRef(0);

  const accentColor = useMemo(() => new THREE.Color(accent), [accent]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);
    const s: BotState = botState;

    /* --- one-shot poke reactions (raycast driven) --- */
    if (poke.nonce !== lastNonce.current) {
      lastNonce.current = poke.nonce;
      pokeStart.current = t;
    }
    const pokeAge = t - pokeStart.current;
    const pokeEnergy =
      pokeStart.current === 0 ? 0 : Math.max(0, 1 - pokeAge / 0.9);

    /* --- body float / breathing --- */
    if (root.current) {
      const hover = s === "thinking" ? 0.12 : 0.05;
      root.current.position.y =
        Math.sin(t * (s === "thinking" ? 2.2 : 1.3)) * hover - 0.9;

      // Happy: full 360 spin
      spin.current =
        s === "happy"
          ? spin.current + dt * 6.5
          : THREE.MathUtils.damp(spin.current % (Math.PI * 2), 0, 5, dt);
      root.current.rotation.y = spin.current;
    }

    if (torso.current) {
      const breathe = 1 + Math.sin(t * 1.6) * 0.018;
      torso.current.scale.set(1, breathe, 1);
      // Listening leans forward; speaking bobs rhythmically.
      const leanTarget =
        s === "listening"
          ? 0.16
          : s === "speaking"
            ? Math.sin(t * 7) * 0.05
            : Math.sin(t * 0.9) * 0.02;
      torso.current.rotation.x = THREE.MathUtils.damp(
        torso.current.rotation.x,
        leanTarget,
        4,
        dt,
      );
      const swayTarget =
        s === "confused" ? Math.sin(t * 9) * 0.22 : Math.sin(t * 0.7) * 0.04;
      torso.current.rotation.z = THREE.MathUtils.damp(
        torso.current.rotation.z,
        swayTarget,
        5,
        dt,
      );
    }

    /* --- head: cursor tracking with damped spherical interpolation --- */
    const head = headRef.current;
    if (head) {
      const shake = s === "confused" ? Math.sin(t * 11) * 0.35 : 0;
      const tiltBack = s === "thinking" ? -0.18 + Math.sin(t * 1.8) * 0.06 : 0;
      const targetX = state.pointer.y * 0.4 + tiltBack;
      const targetY = state.pointer.x * 0.6 + shake;
      head.rotation.x = THREE.MathUtils.damp(head.rotation.x, targetX, 4, dt);
      head.rotation.y = THREE.MathUtils.damp(head.rotation.y, targetY, 4, dt);
      head.rotation.z = THREE.MathUtils.damp(
        head.rotation.z,
        s === "confused" ? 0.2 : s === "thinking" ? 0.14 : 0,
        3,
        dt,
      );
      if (poke.part === "head" && pokeEnergy > 0) {
        head.rotation.z += Math.sin(pokeAge * 34) * 0.25 * pokeEnergy;
        head.position.y = 1.28 + Math.sin(pokeAge * 26) * 0.04 * pokeEnergy;
      } else {
        head.position.y = THREE.MathUtils.damp(head.position.y, 1.28, 6, dt);
      }
    }

    /* --- chest core: pulse with state + audio amplitude --- */
    if (core.current) {
      const base =
        s === "thinking"
          ? 0.55 + Math.abs(Math.sin(t * 6)) * 0.45
          : 0.35 + Math.sin(t * 2) * 0.1;
      const boost = s === "speaking" ? audioLevel * 0.8 : 0;
      const pokeBoost = poke.part === "chest" ? pokeEnergy * 1.2 : 0;
      const mat = core.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.damp(
        mat.emissiveIntensity,
        base + boost + pokeBoost,
        9,
        dt,
      );
      const scale =
        1 + (boost + pokeBoost) * 0.16 + (s === "thinking" ? 0.05 : 0);
      core.current.scale.setScalar(
        THREE.MathUtils.damp(core.current.scale.x, scale, 8, dt),
      );
    }

    /* --- thinking rings --- */
    const ringSpeed = s === "thinking" ? 2.6 : 0.35;
    if (ringA.current) ringA.current.rotation.z += dt * ringSpeed;
    if (ringB.current) ringB.current.rotation.x += dt * ringSpeed * 1.4;

    /* --- arms: gesture while speaking, wave when happy --- */
    const gesture = s === "speaking" ? Math.sin(t * 6) * 0.5 : 0;
    if (armL.current) {
      const target =
        s === "happy" ? -2.3 + Math.sin(t * 12) * 0.35 : -0.25 - gesture;
      armL.current.rotation.z = THREE.MathUtils.damp(
        armL.current.rotation.z,
        target,
        5,
        dt,
      );
    }
    if (armR.current) {
      const target =
        s === "happy" ? 2.3 : s === "confused" ? 0.9 : 0.25 + gesture;
      armR.current.rotation.z = THREE.MathUtils.damp(
        armR.current.rotation.z,
        target,
        5,
        dt,
      );
    }

    /* --- antenna glow --- */
    if (antenna.current) {
      const mat = antenna.current.material as THREE.MeshStandardMaterial;
      const target =
        s === "confused"
          ? new THREE.Color("#E97366")
          : s === "listening"
            ? new THREE.Color("#22D3EE")
            : accentColor;
      mat.emissive.lerp(target, 0.15);
      mat.emissiveIntensity =
        s === "listening"
          ? 2.2 + Math.sin(t * 8) * 0.6
          : s === "confused"
            ? 1.6 + Math.random() * 1.2
            : 0.9;
    }

    /* --- visor: emissive modulation synced to speech amplitude --- */
    const visor = visorRef.current;
    if (visor) {
      const blink = Math.sin(t * 0.7) > 0.985 ? 0.05 : 1;
      const target =
        (s === "speaking"
          ? 0.9 + audioLevel * 2.4
          : s === "listening"
            ? 1.5
            : 0.8) * blink;
      visor.emissiveIntensity = THREE.MathUtils.damp(
        visor.emissiveIntensity,
        target,
        10,
        dt,
      );
      visor.emissive.lerp(
        s === "confused" ? new THREE.Color("#E97366") : accentColor,
        0.12,
      );
    }
  });

  return (
    <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
      <group ref={root} position={[0, -0.9, 0]} dispose={null}>
        {/* ---------- torso ---------- */}
        <group ref={torso} position={[0, 0.62, 0]}>
          <mesh
            castShadow
            receiveShadow
            onPointerDown={(e) => {
              e.stopPropagation();
              onPoke("chest");
            }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <capsuleGeometry args={[0.42, 0.5, 8, 24]} />
            <meshStandardMaterial
              color={body}
              metalness={0.92}
              roughness={0.24}
            />
          </mesh>

          {/* chest core reactor */}
          <mesh ref={core} position={[0, 0.06, 0.4]}>
            <sphereGeometry args={[0.14, 32, 32]} />
            <meshStandardMaterial
              color="#0B0D12"
              emissive={accent}
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.15}
              toneMapped={false}
            />
          </mesh>

          {/* orbiting thought rings */}
          <mesh ref={ringA} position={[0, 0.06, 0.4]}>
            <torusGeometry args={[0.26, 0.012, 12, 64]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.7}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={ringB}
            position={[0, 0.06, 0.4]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.33, 0.008, 12, 64]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.45}
              toneMapped={false}
            />
          </mesh>

          {/* shoulders + arms */}
          {([-1, 1] as const).map((side) => (
            <group
              key={side}
              ref={side === -1 ? armL : armR}
              position={[side * 0.52, 0.2, 0]}
            >
              <mesh castShadow>
                <sphereGeometry args={[0.13, 20, 20]} />
                <meshStandardMaterial
                  color={accent}
                  metalness={0.85}
                  roughness={0.3}
                />
              </mesh>
              <mesh castShadow position={[side * 0.06, -0.34, 0]}>
                <capsuleGeometry args={[0.075, 0.42, 6, 16]} />
                <meshStandardMaterial
                  color={body}
                  metalness={0.9}
                  roughness={0.28}
                />
              </mesh>
              <mesh castShadow position={[side * 0.09, -0.62, 0]}>
                <sphereGeometry args={[0.1, 20, 20]} />
                <meshStandardMaterial
                  color={accent}
                  metalness={0.8}
                  roughness={0.25}
                />
              </mesh>
            </group>
          ))}

          {/* hover base */}
          <mesh castShadow position={[0, -0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.12, 0.22, 24]} />
            <meshStandardMaterial
              color={body}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, -0.66, 0]}>
            <sphereGeometry args={[0.1, 20, 20]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* ---------- head ---------- */}
        <group
          ref={headRef as React.MutableRefObject<THREE.Group | null>}
          position={[0, 1.28, 0]}
        >
          <mesh
            castShadow
            receiveShadow
            onPointerDown={(e) => {
              e.stopPropagation();
              onPoke("head");
            }}
            onPointerOver={() => (document.body.style.cursor = "pointer")}
            onPointerOut={() => (document.body.style.cursor = "auto")}
          >
            <boxGeometry args={[0.62, 0.5, 0.55]} />
            <meshStandardMaterial
              color={body}
              metalness={0.95}
              roughness={0.18}
            />
          </mesh>

          {/* visor — emissive intensity driven by TTS amplitude */}
          <mesh position={[0, 0.03, 0.29]}>
            <boxGeometry args={[0.46, 0.2, 0.04]} />
            <meshStandardMaterial
              ref={
                visorRef as React.MutableRefObject<THREE.MeshStandardMaterial | null>
              }
              color="#05070B"
              emissive={accent}
              emissiveIntensity={1}
              metalness={0.2}
              roughness={0.1}
              toneMapped={false}
            />
          </mesh>

          {/* ear pods */}
          {([-1, 1] as const).map((side) => (
            <mesh key={side} position={[side * 0.34, 0, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.08, 20]} />
              <meshStandardMaterial
                color={accent}
                metalness={0.85}
                roughness={0.25}
              />
            </mesh>
          ))}

          {/* antenna */}
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
            <meshStandardMaterial
              color="#6B7280"
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
          <mesh ref={antenna} position={[0, 0.48, 0]}>
            <sphereGeometry args={[0.05, 20, 20]} />
            <meshStandardMaterial
              color="#0B0D12"
              emissive={accent}
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </Float>
  );
}
