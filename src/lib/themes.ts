import type { BotState, BotStateMeta, ThemeId, ThemePreset } from "@/types";

/** Environment lighting presets exposed in the customizer panel. */
export const THEMES: Record<ThemeId, ThemePreset> = {
  cyberpunk: {
    id: "cyberpunk",
    label: "Cyberpunk Neon",
    environment: "night",
    background: ["#0B0D12", "#131A2B"],
    fog: "#0B0D12",
    keyLight: "#7DD3FC",
    keyIntensity: 2.1,
    rimLight: "#A78BFA",
    rimIntensity: 2.6,
    ambient: 0.35,
    groundColor: "#05070B",
    defaultAccent: "#22D3EE",
  },
  studio: {
    id: "studio",
    label: "Studio White",
    environment: "studio",
    background: ["#EFEFEE", "#C9CBD0"],
    fog: "#DCDDDF",
    keyLight: "#FFFFFF",
    keyIntensity: 2.8,
    rimLight: "#BFD7FF",
    rimIntensity: 1.1,
    ambient: 0.9,
    groundColor: "#B9BBBF",
    defaultAccent: "#2783DE",
  },
  sunset: {
    id: "sunset",
    label: "Sunset Warmth",
    environment: "sunset",
    background: ["#2A1524", "#6E3324"],
    fog: "#3A1B22",
    keyLight: "#FFB37A",
    keyIntensity: 2.4,
    rimLight: "#FF6B6B",
    rimIntensity: 1.8,
    ambient: 0.5,
    groundColor: "#1E0F14",
    defaultAccent: "#DE9255",
  },
};

export const THEME_LIST = Object.values(THEMES);

/** Accent swatches for the robot's metallic finish. */
export const ACCENTS = [
  { label: "Cyan", value: "#22D3EE" },
  { label: "Blue", value: "#5E9FE8" },
  { label: "Violet", value: "#A78BFA" },
  { label: "Amber", value: "#DE9255" },
  { label: "Mint", value: "#72BC8F" },
  { label: "Rose", value: "#DF84A8" },
];

export const BODY_FINISHES = [
  { label: "Graphite", value: "#2B303B" },
  { label: "Titanium", value: "#8A9099" },
  { label: "Pearl", value: "#E7E7E5" },
  { label: "Obsidian", value: "#14171E" },
];

/**
 * State machine metadata: label, target GLTF clip and UI colour.
 * `clip` is matched case-insensitively against the loaded model's clips,
 * with a graceful fallback to the first available clip.
 */
export const BOT_STATES: Record<BotState, BotStateMeta> = {
  idle: {
    label: "Idle",
    clip: "Idle",
    color: "#5E9FE8",
    hint: "Breathing, gentle sway, cursor tracking",
  },
  listening: {
    label: "Listening",
    clip: "Listening",
    color: "#22D3EE",
    hint: "Leaning in, antenna glowing",
  },
  thinking: {
    label: "Thinking",
    clip: "Thinking",
    color: "#A78BFA",
    hint: "Hovering, core pulsing, rings spinning",
  },
  speaking: {
    label: "Speaking",
    clip: "Talking",
    color: "#72BC8F",
    hint: "Gesturing, visor modulating with audio",
  },
  happy: {
    label: "Happy",
    clip: "Wave",
    color: "#EAC26B",
    hint: "360° spin, arm wave, bright pulse",
  },
  confused: {
    label: "Confused",
    clip: "Confused",
    color: "#E97366",
    hint: "Head shake, shrug, red antenna spark",
  },
};
