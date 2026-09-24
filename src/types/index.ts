/** Finite set of visual/behavioural states the 3D character can be in. */
export type BotState =
  "idle" | "listening" | "thinking" | "speaking" | "happy" | "confused";

export type Emotion = "neutral" | "happy" | "confused";

export type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: number;
  emotion?: Emotion;
  /** True while a streamed assistant message is still being appended to. */
  streaming?: boolean;
  error?: boolean;
};

export type ThemeId = "cyberpunk" | "studio" | "sunset";

export type ThemePreset = {
  id: ThemeId;
  label: string;
  /** Drei <Environment /> preset. */
  environment: "night" | "studio" | "sunset";
  background: [string, string];
  fog: string;
  keyLight: string;
  keyIntensity: number;
  rimLight: string;
  rimIntensity: number;
  ambient: number;
  groundColor: string;
  defaultAccent: string;
};

export type BotStateMeta = {
  label: string;
  /** Name of the GLTF animation clip to cross-fade to. */
  clip: string;
  color: string;
  hint: string;
};
