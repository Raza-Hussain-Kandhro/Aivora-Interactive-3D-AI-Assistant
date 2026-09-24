import { GoogleGenAI } from "@google/genai";
import type { Message } from "@/types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const MODEL_CANDIDATES: string[] = Array.from(
  new Set(
    [
      import.meta.env.VITE_GEMINI_MODEL?.trim(),
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
    ].filter((m): m is string => Boolean(m)),
  ),
);
const MODEL = MODEL_CANDIDATES[0];


export const hasApiKey = Boolean(API_KEY);

const SYSTEM_INSTRUCTION = `You are Aivora, an embodied 3D AI assistant rendered as a friendly metallic robot.
You are warm, concise and precise. Use Markdown: short paragraphs, bullet lists and fenced code blocks with language tags.
Keep answers under ~180 words unless the user asks for depth. Never mention that you are a language model.`;

const client = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

type HistoryTurn = { role: "user" | "model"; parts: [{ text: string }] };

function toHistory(messages: Message[]): HistoryTurn[] {
  return messages
    .filter((m) => m.text.trim().length > 0 && !m.error)
    .slice(-16)
    .map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.text }] as [{ text: string }],
    }));
}

export type StreamHandlers = {
  onChunk: (text: string) => void;
  signal?: AbortSignal;
};

/**
 * Streams a Gemini response chunk-by-chunk.
 * Falls back to a deterministic mock stream when no API key is configured,
 * so the whole experience (states, TTS, visor glow) still works offline.
 */
export async function streamAssistantReply(
  history: Message[],
  prompt: string,
  { onChunk, signal }: StreamHandlers,
): Promise<string> {
  if (!client) return mockStream(prompt, onChunk, signal);

  const contents: HistoryTurn[] = [
    ...toHistory(history),
    { role: "user", parts: [{ text: prompt }] },
  ];

  const stream = await client.models.generateContentStream({
    model: MODEL,
    contents,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.8,
      maxOutputTokens: 1024,
    },
  });

  let full = "";
  for await (const chunk of stream) {
    if (signal?.aborted) break;
    const text = chunk.text ?? "";
    if (!text) continue;
    full += text;
    onChunk(text);
  }

  if (!full.trim()) throw new Error("Gemini returned an empty response.");
  return full;
}

/* ------------------------------------------------------------------ *
 * Graceful mock fallback (PRD 2.1 — "graceful mock fallback")
 * ------------------------------------------------------------------ */
function mockReplyFor(prompt: string): string {
  const p = prompt.toLowerCase();

  if (p.includes("code") || p.includes("react") || p.includes("three")) {
    return `Great question — here's the core idea.\n\nThe head bone is damped toward the pointer every frame:\n\n\`\`\`tsx\nuseFrame((state, delta) => {\n  head.rotation.y = THREE.MathUtils.damp(head.rotation.y, state.pointer.x * 0.6, 4, delta)\n  head.rotation.x = THREE.MathUtils.damp(head.rotation.x, state.pointer.y * 0.4, 4, delta)\n})\n\`\`\`\n\nDamping keeps the motion smooth and frame-rate independent. 🎉`;
  }

  if (p.includes("who") || p.includes("you")) {
    return `I'm **Aivora** — an interactive 3D assistant.\n\n- I *listen* while you type or speak\n- I *think* while your request streams\n- I *speak* with a visor that pulses to my voice\n\nAdd a \`VITE_GEMINI_API_KEY\` to connect me to a live model. Right now I'm running in mock mode.`;
  }

  return `I'm currently in **mock mode** because no Gemini API key is configured.\n\nEverything else is live: state machine, animation cross-fading, speech synthesis and the visor glow.\n\n1. Copy \`.env.example\` to \`.env\`\n2. Set \`VITE_GEMINI_API_KEY\`\n3. Restart the dev server\n\nThen ask me anything for real answers. ✅`;
}

async function mockStream(
  prompt: string,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const reply = mockReplyFor(prompt);
  const tokens = reply.match(/\S+\s*/g) ?? [reply];

  await new Promise((r) => setTimeout(r, 600)); // simulated latency → 'thinking'

  let full = "";
  for (const token of tokens) {
    if (signal?.aborted) break;
    full += token;
    onChunk(token);
    await new Promise((r) => setTimeout(r, 26));
  }
  return full;
}
