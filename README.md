# Aivora — Interactive 3D AI Assistant

An animated 3D robot that listens, thinks, speaks and physically reacts to your input.
Built from the `Interactive_3D_AI_Assistant_PRD_TRD` spec.

**Stack:** React 18 + TypeScript + Vite · `three` / `@react-three/fiber` / `@react-three/drei` · `zustand` · Tailwind CSS · `framer-motion` · `lucide-react` · `react-markdown` · `@google/genai` · Web Speech API

---

## 1. Quick start

```bash
# 1. install
npm install

# 2. configure the AI engine (optional — the app runs in mock mode without it)
cp .env.example .env
# then set VITE_GEMINI_API_KEY=...

# 3. run
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
npm run preview
```

### Tailwind setup (already committed, shown for reference)

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` scans `./index.html` and `./src/**/*.{ts,tsx}`; `src/index.css` imports the three Tailwind layers.

### Optional: rigged GLB character

Drop a Draco-compressed GLB at `public/models/robot.glb` and set:

```bash
VITE_ROBOT_MODEL_URL=/models/robot.glb
```

Clips are matched case-insensitively (`Idle`, `Listening`, `Thinking`, `Talking`, `Wave`, `Confused`), and the head bone / visor material are auto-detected by name.
If the URL is missing or fails to load, the app falls back to the **procedural primitive robot** — fully animated, so nothing ever renders blank.

---

## 2. Architecture

```
                    +-----------------------------+
                    |     Zustand Global Store    |
                    |  botState / messages /      |
                    |  audioLevel / theme / poke  |
                    +--------------+--------------+
                                   |
            +----------------------+----------------------+
            v                                             v
  3D Canvas (R3F)                                2D Chat UI (DOM)
  - GLTF skeleton + clip cross-fade              - message list + Markdown
  - head-bone cursor tracking (damp)             - streaming Gemini output
  - visor emissive <- audioLevel                 - mic (STT) button
  - mesh raycast micro-reactions                 - theme customizer + export
```

```
src/
  main.tsx / App.tsx            responsive shell (split screen -> mobile tabs)
  types/index.ts                BotState, Message, ThemePreset
  store/useAppStore.ts          single source of truth + localStorage persistence
  lib/
    gemini.ts                   @google/genai streaming + graceful mock fallback
    sentiment.ts                lightweight sentiment + markdown stripping for TTS
    themes.ts                   lighting presets, swatches, state->clip matrix
    exporters.ts                JSON / Markdown conversation export
  hooks/
    useSpeechRecognition.ts     webkitSpeechRecognition -> chat draft
    useSpeechSynthesis.ts       speechSynthesis + amplitude envelope -> store
  three/
    Scene.tsx                   Canvas, lighting, Environment, ContactShadows, OrbitControls
    RobotModel.tsx              useGLTF + useAnimations, cross-fading, raycast
    FallbackRobot.tsx           procedural primitive robot
  components/
    Viewport.tsx  StateBadge.tsx  ThemeCustomizer.tsx
    ChatPanel.tsx  ChatInput.tsx  MessageBubble.tsx  Markdown.tsx
```

---

## 3. State machine

| State       | Trigger                              | Visual behaviour                               |
| ----------- | ------------------------------------ | ---------------------------------------------- |
| `idle`      | default / stream complete            | breathing, sway, blink, cursor tracking        |
| `listening` | input focus, typing, mic active      | leans forward, antenna cyan glow               |
| `thinking`  | waiting for the API stream           | hovers, chest core pulses, rings spin          |
| `speaking`  | tokens streaming / TTS playing       | arm gestures, bobbing, visor pulses with audio |
| `happy`     | positive sentiment, chest click      | 360° spin, arm wave, bright pulse              |
| `confused`  | error, negative sentiment, head poke | head shake, shrug, red antenna spark           |

---

## 4. Performance & accessibility (TRD 4.4)

- `dpr={[1, 1.8]}`, ACES tone mapping, manual chunk splitting for `three` / R3F.
- All per-frame motion uses `THREE.MathUtils.damp` with a clamped delta, so it is frame-rate independent (60 FPS desktop / 30 FPS mobile targets).
- Drei `Html` progress loader while assets stream in.
- Keyboard: `Enter` send, `Shift+Enter` newline, `Cmd/Ctrl+K` toggle drawer, `Esc` close panels.
- `aria-live="polite"` on the message list and the state badge; 44px minimum hit targets; `prefers-reduced-motion` respected.

## 5. Security note

`VITE_*` variables are bundled into the client. Use a key restricted to development, or proxy Gemini through a small server route before shipping to production.
