import { create } from "zustand";
import type { BotState, Emotion, Message, ThemeId } from "@/types";
import { THEMES } from "@/lib/themes";

const STORAGE_KEY = "aivora:session:v1";

type PersistedSession = {
  messages: Message[];
  theme: ThemeId;
  accentColor: string;
  bodyColor: string;
  isMuted: boolean;
  ttsEnabled: boolean;
};

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadSession(): Partial<PersistedSession> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    return {
      ...parsed,
      messages: (parsed.messages ?? []).map((m) => ({
        ...m,
        streaming: false,
      })),
    };
  } catch {
    return {};
  }
}

export type AppStore = {
  /* ---- 3D / character state ---- */
  botState: BotState;
  /** 0..1 amplitude driving visor emissive glow while speaking. */
  audioLevel: number;
  /** Bumped to fire a one-shot micro-reaction on a body part. */
  poke: { part: "head" | "chest" | "none"; nonce: number };

  /* ---- conversation ---- */
  messages: Message[];
  isStreaming: boolean;
  inputDraft: string;

  /* ---- audio ---- */
  isMuted: boolean;
  ttsEnabled: boolean;
  isRecording: boolean;

  /* ---- appearance / layout ---- */
  theme: ThemeId;
  accentColor: string;
  bodyColor: string;
  customizerOpen: boolean;
  chatOpen: boolean;
  mobileTab: "scene" | "chat";

  /* ---- actions ---- */
  setBotState: (state: BotState) => void;
  flashBotState: (state: BotState, ms?: number) => void;
  setAudioLevel: (level: number) => void;
  pokePart: (part: "head" | "chest") => void;

  addMessage: (msg: Omit<Message, "id" | "timestamp">) => string;
  appendToMessage: (id: string, chunk: string) => void;
  finalizeMessage: (id: string, patch?: Partial<Message>) => void;
  setMessageEmotion: (id: string, emotion: Emotion) => void;
  setIsStreaming: (streaming: boolean) => void;
  setInputDraft: (value: string) => void;
  clearMessages: () => void;

  toggleMute: () => void;
  setTtsEnabled: (enabled: boolean) => void;
  setIsRecording: (recording: boolean) => void;

  setTheme: (theme: ThemeId) => void;
  setAccentColor: (color: string) => void;
  setBodyColor: (color: string) => void;
  setCustomizerOpen: (open: boolean) => void;
  setChatOpen: (open: boolean) => void;
  setMobileTab: (tab: "scene" | "chat") => void;
};

const saved = typeof window === "undefined" ? {} : loadSession();

let flashTimer: ReturnType<typeof setTimeout> | undefined;

export const useAppStore = create<AppStore>((set, get) => ({
  botState: "idle",
  audioLevel: 0,
  poke: { part: "none", nonce: 0 },

  messages: saved.messages ?? [],
  isStreaming: false,
  inputDraft: "",

  isMuted: saved.isMuted ?? false,
  ttsEnabled: saved.ttsEnabled ?? true,
  isRecording: false,

  theme: saved.theme ?? "cyberpunk",
  accentColor: saved.accentColor ?? THEMES.cyberpunk.defaultAccent,
  bodyColor: saved.bodyColor ?? "#2B303B",
  customizerOpen: false,
  chatOpen: true,
  mobileTab: "scene",

  setBotState: (botState) => set({ botState }),

  /** Temporarily show an emotional state, then fall back to a resting state. */
  flashBotState: (state, ms = 2200) => {
    if (flashTimer) clearTimeout(flashTimer);
    set({ botState: state });
    flashTimer = setTimeout(() => {
      const { isStreaming, isRecording } = get();
      set({
        botState: isStreaming ? "speaking" : isRecording ? "listening" : "idle",
      });
    }, ms);
  },

  setAudioLevel: (audioLevel) => set({ audioLevel }),

  pokePart: (part) => set((s) => ({ poke: { part, nonce: s.poke.nonce + 1 } })),

  addMessage: (msg) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
    }));
    return id;
  },

  appendToMessage: (id, chunk) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, text: m.text + chunk } : m,
      ),
    })),

  finalizeMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, streaming: false, ...patch } : m,
      ),
    })),

  setMessageEmotion: (id, emotion) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, emotion } : m)),
    })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setInputDraft: (inputDraft) => set({ inputDraft }),
  clearMessages: () => set({ messages: [] }),

  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
  setIsRecording: (isRecording) => set({ isRecording }),

  setTheme: (theme) => set({ theme, accentColor: THEMES[theme].defaultAccent }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setBodyColor: (bodyColor) => set({ bodyColor }),
  setCustomizerOpen: (customizerOpen) => set({ customizerOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setMobileTab: (mobileTab) => set({ mobileTab }),
}));

/* ------------------------------------------------------------------ *
 * localStorage persistence (session saving, PRD 2.2 "Persistence")
 * ------------------------------------------------------------------ */
if (typeof window !== "undefined") {
  let writeTimer: ReturnType<typeof setTimeout> | undefined;

  useAppStore.subscribe((state) => {
    if (writeTimer) clearTimeout(writeTimer);
    writeTimer = setTimeout(() => {
      const payload: PersistedSession = {
        messages: state.messages.slice(-200),
        theme: state.theme,
        accentColor: state.accentColor,
        bodyColor: state.bodyColor,
        isMuted: state.isMuted,
        ttsEnabled: state.ttsEnabled,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        /* quota exceeded — ignore, session is non-critical */
      }
    }, 250);
  });
}

/* Selector helpers keep components subscribed to the narrowest slice. */
export const selectBotState = (s: AppStore) => s.botState;
export const selectAudioLevel = (s: AppStore) => s.audioLevel;
