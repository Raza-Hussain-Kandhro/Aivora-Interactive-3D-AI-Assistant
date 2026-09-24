import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  Preload,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";
import RobotModel from "./RobotModel";
import { useAppStore } from "@/store/useAppStore";
import { THEMES } from "@/lib/themes";

/** Stylised loader shown while the GLTF / environment map streams in. */
function SceneLoader() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return (
    <Html center>
      <div
        className="w-56 select-none text-center"
        role="status"
        aria-live="polite"
      >
        <p className="mb-2 text-sm font-medium text-white">Booting Aivora</p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-aivora-cyan transition-[width] duration-200"
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/60">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}

function Lighting() {
  const theme = useAppStore((s) => s.theme);
  const accent = useAppStore((s) => s.accentColor);
  const preset = THEMES[theme];

  return (
    <>
      <ambientLight intensity={preset.ambient} />
      <directionalLight
        position={[4, 6, 5]}
        intensity={preset.keyIntensity}
        color={preset.keyLight}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-5, 5, 5, -5, 0.1, 20]}
        />
      </directionalLight>
      <spotLight
        position={[-5, 3, -4]}
        angle={0.7}
        penumbra={0.9}
        intensity={preset.rimIntensity}
        color={preset.rimLight}
      />
      {/* Accent bounce light so the customizer colour reads in the scene */}
      <pointLight
        position={[0, 0.4, 2.2]}
        intensity={1.1}
        color={accent}
        distance={6}
      />
      <Environment preset={preset.environment} background={false} />
    </>
  );
}

export default function Scene() {
  const theme = useAppStore((s) => s.theme);
  const preset = THEMES[theme];

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.6, 4.4], fov: 42, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
      className="!absolute inset-0"
      aria-label="Interactive 3D viewport with the Aivora robot"
    >
      <color attach="background" args={[preset.background[0]]} />
      <fog attach="fog" args={[preset.fog, 7, 18]} />

      <Lighting />

      <Suspense fallback={<SceneLoader />}>
        <RobotModel />
        <ContactShadows
          position={[0, -1.55, 0]}
          opacity={0.55}
          scale={9}
          blur={2.6}
          far={4}
          color={preset.groundColor}
        />
        <Preload all />
      </Suspense>

      {/* Constrained orbit: no flipping under the floor, limited zoom */}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={2.6}
        maxDistance={7}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.9}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        enableDamping
        dampingFactor={0.08}
        target={[0, 0.15, 0]}
      />
    </Canvas>
  );
}
