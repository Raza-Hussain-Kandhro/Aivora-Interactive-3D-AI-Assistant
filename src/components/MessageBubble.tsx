import { motion } from "framer-motion";
import { AlertTriangle, Bot, User } from "lucide-react";
import { Markdown } from "./Markdown";
import type { Message } from "@/types";

const EMOTION_LABEL: Record<string, string> = {
  happy: "😄 upbeat",
  confused: "🤔 uncertain",
};

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline ${
          isUser
            ? "bg-white/10 text-white/80"
            : "bg-aivora-cyan/15 text-aivora-cyan"
        }`}
        aria-hidden
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div
        className={`min-w-0 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}
      >
        <div
          className={`inline-block max-w-full overflow-hidden rounded-xl border px-3.5 py-2.5 text-left ${
            message.error
              ? "border-aivora-danger/40 bg-aivora-danger/10 text-white"
              : isUser
                ? "border-white/10 bg-white/[0.07] text-white"
                : "border-hairline bg-raised text-white"
          }`}
        >
          {message.error && (
            <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-aivora-danger">
              <AlertTriangle size={13} /> Connection error
            </span>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {message.text}
            </p>
          ) : (
            <Markdown text={message.text || "…"} />
          )}

          {message.streaming && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[3px] animate-breathe bg-aivora-cyan" />
          )}
        </div>

        <div className="mt-1 px-1 text-[11px] text-white/40">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {!isUser && message.emotion && message.emotion !== "neutral"
            ? ` · ${EMOTION_LABEL[message.emotion]}`
            : ""}
        </div>
      </div>
    </motion.div>
  );
}
