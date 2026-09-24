/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_ROBOT_MODEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* Web Speech API — vendor-prefixed globals are not in the default TS DOM lib. */
interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}
