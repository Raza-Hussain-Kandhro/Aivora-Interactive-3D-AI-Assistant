import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { BOT_STATES } from "@/lib/themes";
import { FallbackRobot } from "./FallbackRobot";

const MODEL_URL = import.meta.env.VITE_ROBOT_MODEL_URL?.trim() || "";

type RiggedProps = {
  url: string;
  headRef: React.MutableRefObject<THREE.Object3D | null>;
  visorRef: React.MutableRefObject<THREE.MeshStandardMaterial | null>;
  onPoke: (part: "head" | "chest") => void;
};

/** Names we probe for when locating the head bone / visor material in a GLB. */
const HEAD_HINTS = ["head", "neck", "mixamorigHead", "Head_1"];
const VISOR_HINTS = ["visor", "eye", "screen", "face", "glass"];
const CHEST_HINTS = ["chest", "core", "reactor", "torso", "spine"];

function findByHints(
  root: THREE.Object3D,
  hints: string[],
): THREE.Object3D | null {
  let match: THREE.Object3D | null = null;
  root.traverse((child) => {
    if (match) return;
    const name = child.name.toLowerCase();
    if (hints.some((h) => name.includes(h.toLowerCase()))) match = child;
  });
  return match;
}

/**
 * Rigged GLTF character.
 * - `useGLTF` loads the mesh + skeleton, `useAnimations` drives the clips.
 * - Clips are cross-faded whenever the Zustand `botState` changes.
 * - The head bone is damped toward the pointer every frame.
 * - Raycast hits on head/chest fire micro-reactions.
 */
function RiggedRobot({ url, headRef, visorRef, onPoke }: RiggedProps) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const { actions, mixer } = useAnimations(animations, group);

  const botState = useAppStore((s) => s.botState);
  const accent = useAppStore((s) => s.accentColor);
  const bodyColor = useAppStore((s) => s.bodyColor);
  const audioLevel = useAppStore((s) => s.audioLevel);
  const poke = useAppStore((s) => s.poke);

  const activeAction = useRef<THREE.AnimationAction | null>(null);
  const pokeStart = useRef(0);
  const lastNonce = useRef(poke.nonce);

  // Clone so multiple instances / HMR don't mutate the cached scene graph.
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = mesh.material as THREE.Material;
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => m.clone());
        } else if (mat) {
          mesh.material = mat.clone();
        }
      }
    });
    return clone;
  }, [scene]);

  // Resolve head bone + visor material once the graph is ready.
  useEffect(() => {
    headRef.current = findByHints(model, HEAD_HINTS);
    const visorNode = findByHints(model, VISOR_HINTS) as THREE.Mesh | null;
    const visorMat = visorNode?.material;
    if (visorMat && !Array.isArray(visorMat) && "emissive" in visorMat) {
      visorRef.current = visorMat as THREE.MeshStandardMaterial;
    }
    return () => {
      headRef.current = null;
      visorRef.current = null;
    };
  }, [model, headRef, visorRef]);

  // Recolour metallic body + accent parts from the customizer.
  useEffect(() => {
    model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat || Array.isArray(mesh.material) || !("color" in mat)) return;
      if (mat === visorRef.current) return;
      const name = mesh.name.toLowerCase();
      const isAccent = /accent|trim|light|glow|joint|ring|antenna/.test(name);
      mat.color.set(isAccent ? accent : bodyColor);
      mat.metalness = Math.max(mat.metalness, 0.8);
      mat.roughness = Math.min(mat.roughness, 0.35);
      if (isAccent && "emissive" in mat) {
        mat.emissive.set(accent);
        mat.emissiveIntensity = 0.8;
      }
    });
  }, [model, accent, bodyColor, visorRef]);

  /* ---- animation cross-fading tied to botState ---- */
  useEffect(() => {
    const names = Object.keys(actions);
    if (names.length === 0) return;

    const wanted = BOT_STATES[botState].clip.toLowerCase();
    const matched =
      names.find((n) => n.toLowerCase() === wanted) ??
      names.find((n) => n.toLowerCase().includes(wanted)) ??
      names.find((n) => n.toLowerCase().includes("idle")) ??
      names[0];

    const next = actions[matched];
    if (!next || next === activeAction.current) return;

    const oneShot = botState === "happy" || botState === "confused";
    next.reset();
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = oneShot;
    next.fadeIn(0.3).play();
    activeAction.current?.fadeOut(0.3);
    activeAction.current = next;
  }, [actions, botState]);

  useEffect(() => {
      return () => {
        mixer.stopAllAction();
      };
    }, [mixer]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;

    if (poke.nonce !== lastNonce.current) {
      lastNonce.current = poke.nonce;
      pokeStart.current = t;
    }
    const pokeAge = t - pokeStart.current;
    const pokeEnergy =
      pokeStart.current === 0 ? 0 : Math.max(0, 1 - pokeAge / 0.9);

    // Head bone tracks the pointer with damped interpolation.
    const head = headRef.current;
    if (head) {
      const shake = botState === "confused" ? Math.sin(t * 11) * 0.3 : 0;
      head.rotation.x = THREE.MathUtils.damp(
        head.rotation.x,
        state.pointer.y * 0.4,
        4,
        dt,
      );
      head.rotation.y = THREE.MathUtils.damp(
        head.rotation.y,
        state.pointer.x * 0.6 + shake,
        4,
        dt,
      );
      if (poke.part === "head" && pokeEnergy > 0) {
        head.rotation.z = Math.sin(pokeAge * 32) * 0.22 * pokeEnergy;
      }
    }

    // Hovering / breathing offset on top of the skeletal clip.
    if (group.current) {
      const hover = botState === "thinking" ? 0.1 : 0.04;
      group.current.position.y =
        Math.sin(t * (botState === "thinking" ? 2.2 : 1.3)) * hover;
    }

    // Visor emissive follows speech amplitude.
    const visor = visorRef.current;
    if (visor) {
      const target =
        botState === "speaking"
          ? 0.9 + audioLevel * 2.4
          : botState === "listening"
            ? 1.5
            : 0.7;
      visor.emissiveIntensity = THREE.MathUtils.damp(
        visor.emissiveIntensity,
        target,
        10,
        dt,
      );
      visor.emissive.lerp(
        new THREE.Color(botState === "confused" ? "#E97366" : accent),
        0.12,
      );
    }
  });

  return (
    <group ref={group} dispose={null}>
      <primitive
        object={model}
        onPointerDown={(
          e: THREE.Intersection & {
            object: THREE.Object3D;
            stopPropagation: () => void;
          },
        ) => {
          e.stopPropagation();
          const name = e.object.name.toLowerCase();
          if (HEAD_HINTS.some((h) => name.includes(h.toLowerCase())))
            onPoke("head");
          else if (CHEST_HINTS.some((h) => name.includes(h.toLowerCase())))
            onPoke("chest");
          else onPoke("chest");
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      />
    </group>
  );
}

/**
 * Public component. Probes the configured model URL and renders either the
 * rigged GLTF character or the procedural primitive fallback.
 */
export default function RobotModel() {
  const headRef = useRef<THREE.Object3D | null>(null);
  const visorRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const pokePart = useAppStore((s) => s.pokePart);
  const flashBotState = useAppStore((s) => s.flashBotState);
  const [modelFailed, setModelFailed] = useState(false);

  const onPoke = (part: "head" | "chest") => {
    pokePart(part);
    flashBotState(part === "head" ? "confused" : "happy", 1400);
  };

  // Probe the model URL before handing it to Suspense so a 404 degrades cleanly.
  const [checked, setChecked] = useState(!MODEL_URL);
  useEffect(() => {
    if (!MODEL_URL) return;
    let cancelled = false;
    fetch(MODEL_URL, { method: "HEAD" })
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) setModelFailed(true);
        setChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setModelFailed(true);
        setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const useRig = Boolean(MODEL_URL) && checked && !modelFailed;

  return useRig ? (
    <RiggedRobot
      url={MODEL_URL}
      headRef={headRef}
      visorRef={visorRef}
      onPoke={onPoke}
    />
  ) : (
    <FallbackRobot headRef={headRef} visorRef={visorRef} onPoke={onPoke} />
  );
}

if (MODEL_URL) useGLTF.preload(MODEL_URL);
