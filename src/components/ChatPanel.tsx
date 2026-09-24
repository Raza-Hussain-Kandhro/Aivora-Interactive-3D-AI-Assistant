import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, Sparkles, Square } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { hasApiKey, streamAssistantReply } from "@/lib/gemini";
import { analyzeSentiment } from "@/lib/sentiment";

const SUGGESTIONS = [
  "Who are you, Aivora?",
  "Explain the head-tracking code",
  "Give me 3 UI ideas for a 3D assistant",
];

type Props = { onCollapse?: () => void; collapsible?: boolean };

export function ChatPanel({ onCollapse, collapsible = false }: Props) {
  const messages = useAppStore((s) => s.messages);
  const isStreaming = useAppStore((s) => s.isStreaming);
  const addMessage = useAppStore((s) => s.addMessage);
  const appendToMessage = useAppStore((s) => s.appendToMessage);
  const finalizeMessage = useAppStore((s) => s.finalizeMessage);
  const setIsStreaming = useAppStore((s) => s.setIsStreaming);
  const setInputDraft = useAppStore((s) => s.setInputDraft);
  const setBotState = useAppStore((s) => s.setBotState);
  const flashBotState = useAppStore((s) => s.flashBotState);

  const { speak, cancel: cancelSpeech } = useSpeechSynthesis();
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* --- auto-scroll while streaming, unless the user scrolled up --- */
  const stickToBottom = useRef(true);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }, [messages]);

  /* --- full chat lifecycle: listening -> thinking -> speaking -> idle --- */
  const send = useCallback(
    async (text: string) => {
      if (useAppStore.getState().isStreaming) return;

      const history = useAppStore.getState().messages;
      addMessage({ sender: "user", text });
      setInputDraft("");
      setIsStreaming(true);
      setBotState("thinking");

      const assistantId = addMessage({
        sender: "assistant",
        text: "",
        streaming: true,
      });
      const controller = new AbortController();
      abortRef.current = controller;
      let firstChunk = true;

      try {
        const full = await streamAssistantReply(history, text, {
          signal: controller.signal,
          onChunk: (chunk) => {
            if (firstChunk) {
              firstChunk = false;
              setBotState("speaking");
            }
            appendToMessage(assistantId, chunk);
          },
        });

        const emotion = analyzeSentiment(full);
        finalizeMessage(assistantId, { emotion });
        setIsStreaming(false);

        // Speak the reply; visor glow follows the synthesised amplitude.
        setBotState("speaking");
        await speak(full);

        if (emotion === "happy") flashBotState("happy", 2400);
        else if (emotion === "confused") flashBotState("confused", 2200);
        else setBotState("idle");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        finalizeMessage(assistantId, {
          text: `I couldn't reach the AI engine.\n\n\`${detail}\`\n\nCheck \`VITE_GEMINI_API_KEY\` and your network, then try again.`,
          error: true,
          emotion: "confused",
        });
        setIsStreaming(false);
        flashBotState("confused", 2600);
      } finally {
        abortRef.current = null;
      }
    },
    [
      addMessage,
      appendToMessage,
      finalizeMessage,
      flashBotState,
      setBotState,
      setInputDraft,
      setIsStreaming,
      speak,
    ],
  );

  // Voice input: a finalised transcript is sent automatically.
  const {
    supported: micSupported,
    error: micError,
    toggle: toggleMic,
  } = useSpeechRecognition((transcript) => void send(transcript));

  const stop = () => {
    abortRef.current?.abort();
    cancelSpeech();
    setIsStreaming(false);
    setBotState("idle");
  };

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden bg-surface/80 backdrop-blur-xl md:rounded-xl md:border md:border-hairline md:shadow-soft"
      aria-label="Conversation with Aivora"
    >
      {/* header */}
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-aivora-cyan/15 text-aivora-cyan">
          <Bot size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-white">Aivora</h2>
          <p className="truncate text-[11px] text-white/45">
            {hasApiKey
              ? "Gemini streaming · connected"
              : "Mock mode · no API key set"}
          </p>
        </div>

        {isStreaming && (
          <button
            type="button"
            onClick={stop}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Square size={12} /> Stop
          </button>
        )}

        {collapsible && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse chat drawer"
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white md:flex"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </header>

      {/* messages */}
      <div
        ref={scrollRef}
        className="scroll-area min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-2 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-aivora-cyan/15 text-aivora-cyan">
              <Sparkles size={20} />
            </span>
            <h3 className="text-base font-semibold text-white">
              Say hello to Aivora
            </h3>
            <p className="mt-1 max-w-[38ch] text-sm text-white/50">
              Type or speak. Aivora reacts in 3D while it listens, thinks and
              answers.
            </p>
            <div className="mt-5 grid w-full gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="min-h-[44px] rounded-xl border border-hairline bg-white/[0.03] px-3 text-left text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </AnimatePresence>
        )}

        {isStreaming && messages[messages.length - 1]?.text === "" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 pl-10 text-xs text-white/45"
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-breathe rounded-full bg-aivora-violet"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
            Thinking
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <ChatInput
        onSend={(text) => void send(text)}
        micSupported={micSupported}
        micError={micError}
        onToggleMic={toggleMic}
      />
    </section>
  );
}
