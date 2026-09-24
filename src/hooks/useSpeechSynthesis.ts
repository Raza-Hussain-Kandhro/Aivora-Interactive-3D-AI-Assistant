import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { stripMarkdown } from "@/lib/sentiment";

/**
 * Text-to-Speech playback.
 *
 * `SpeechSynthesis` exposes no audio buffer, so amplitude is synthesised from
 * `onboundary` word events plus a decaying oscillator. That value lands in the
 * Zustand store and drives the robot's visor emissive intensity in the 3D scene.
 */
export function useSpeechSynthesis() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const rafRef = useRef<number | null>(null);
  const boundaryRef = useRef(0);

  const stopMeter = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setAudioLevel(0);
  }, [setAudioLevel]);

  const startMeter = useCallback(() => {
    if (rafRef.current !== null) return;
    const tick = () => {
      const t = performance.now();
      // Envelope: recent word boundaries spike the level, then it decays.
      const sinceWord = (t - boundaryRef.current) / 1000;
      const envelope = Math.max(0, 1 - sinceWord * 2.2);
      const jitter = 0.5 + 0.5 * Math.sin(t / 55);
      setAudioLevel(Math.min(1, 0.22 + envelope * 0.65 * jitter));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [setAudioLevel]);

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
    stopMeter();
  }, [stopMeter, supported]);

  const speak = useCallback(
    (text: string) =>
      new Promise<void>((resolve) => {
        const { isMuted, ttsEnabled } = useAppStore.getState();
        const clean = stripMarkdown(text);
        if (!supported || isMuted || !ttsEnabled || !clean) {
          resolve();
          return;
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(clean);
        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /Google (UK|US) English/i.test(v.name)) ??
          voices.find((v) => v.lang.startsWith(navigator.language)) ??
          voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;

        utterance.rate = 1.02;
        utterance.pitch = 1.06;
        utterance.volume = 1;

        utterance.onstart = () => {
          boundaryRef.current = performance.now();
          startMeter();
        };
        utterance.onboundary = () => {
          boundaryRef.current = performance.now();
        };
        utterance.onend = () => {
          stopMeter();
          resolve();
        };
        utterance.onerror = () => {
          stopMeter();
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }),
    [startMeter, stopMeter, supported],
  );

  // Warm the voice list (Chrome populates it asynchronously) and clean up.
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.cancel();
      stopMeter();
    };
  }, [stopMeter, supported]);

  return { supported, speak, cancel };
}
