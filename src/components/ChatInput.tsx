import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type Props = {
  inputId: string;
  onSend: (text: string) => void;
  micSupported: boolean;
  micError: string | null;
  onToggleMic: () => void;
};

export function ChatInput({
  inputId,
  onSend,
  micSupported,
  micError,
  onToggleMic,
}: Props) {
  const draft = useAppStore((s) => s.inputDraft);
  const setDraft = useAppStore((s) => s.setInputDraft);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const isRecording = useAppStore((s) => s.isRecording);
  const botState = useAppStore((s) => s.botState);
  const setBotState = useAppStore((s) => s.setBotState);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to 5 rows.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  const submit = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    onSend(text);
  };

  return (
    <div className="border-t border-hairline bg-surface/90 p-3 backdrop-blur">
      {micError && (
        <p className="mb-2 rounded-lg border border-aivora-danger/40 bg-aivora-danger/10 px-3 py-1.5 text-xs text-aivora-danger">
          {micError}
        </p>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={onToggleMic}
          disabled={!micSupported}
          title={
            micSupported
              ? isRecording
                ? "Stop dictation"
                : "Start voice input"
              : "Speech recognition unavailable in this browser"
          }
          aria-label={isRecording ? "Stop voice input" : "Start voice input"}
          aria-pressed={isRecording}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
            isRecording
              ? "border-aivora-cyan/60 bg-aivora-cyan/15 text-aivora-cyan"
              : "border-hairline bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {isRecording && (
            <motion.span
              className="absolute inset-0 rounded-xl border border-aivora-cyan"
              animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.25, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          )}
          {micSupported ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <label className="sr-only" htmlFor={inputId}>
  Message Aivora
</label>
        <textarea
  id={inputId}
  ref={textareaRef}
  rows={1}
          value={draft}
          placeholder={isRecording ? "Listening…" : "Ask Aivora anything…"}
          onChange={(e) => {
            setDraft(e.target.value);
            if (!isStreaming && botState !== "listening")
              setBotState("listening");
          }}
          onFocus={() => {
            if (!isStreaming) setBotState("listening");
          }}
          onBlur={() => {
            const { isStreaming: streaming, isRecording: recording } =
              useAppStore.getState();
            if (!streaming && !recording) setBotState("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="scroll-area max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-hairline bg-white/[0.04] px-3.5 py-3 text-[15px] text-white placeholder:text-white/35 focus:border-aivora-cyan/50 focus:outline-none"
        />

        <button
          type="button"
          onClick={submit}
          disabled={isStreaming || draft.trim().length === 0}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-aivora-cyan text-[#04222A] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {isStreaming ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </div>

      <p className="mt-2 px-1 text-[11px] text-white/70">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
