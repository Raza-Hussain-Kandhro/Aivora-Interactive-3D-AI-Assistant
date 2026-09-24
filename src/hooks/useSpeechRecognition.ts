import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

/* Minimal typings for the vendor-prefixed Web Speech API. */
type SpeechRecognitionAlternativeLike = { transcript: string };
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * Speech-to-Text. Interim results stream straight into the chat draft so the
 * user sees words appear while the robot holds the `listening` state.
 */
export function useSpeechRecognition(
  onFinalTranscript?: (text: string) => void,
) {
  const supported = typeof window !== "undefined" && Boolean(getCtor());
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");

  const isRecording = useAppStore((s) => s.isRecording);
  const setIsRecording = useAppStore((s) => s.setIsRecording);
  const setInputDraft = useAppStore((s) => s.setInputDraft);
  const setBotState = useAppStore((s) => s.setBotState);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }

    setError(null);
    finalRef.current = "";

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) finalRef.current += text;
        else interim += text;
      }
      setInputDraft((finalRef.current + interim).trimStart());
    };

    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : `Microphone error: ${event.error}`,
      );
      setIsRecording(false);
      setBotState("confused");
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      const finalText = finalRef.current.trim();
      if (finalText) onFinalTranscript?.(finalText);
      else setBotState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setBotState("listening");
  }, [onFinalTranscript, setBotState, setInputDraft, setIsRecording]);

  const toggle = useCallback(() => {
    if (isRecording) stop();
    else start();
  }, [isRecording, start, stop]);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  return { supported, isRecording, error, start, stop, toggle };
}
