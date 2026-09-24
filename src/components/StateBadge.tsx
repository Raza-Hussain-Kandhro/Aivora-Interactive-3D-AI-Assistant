import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { BOT_STATES } from "@/lib/themes";

/** Live status pill mirroring the Zustand botState (also an aria live region). */
export function StateBadge() {
  const botState = useAppStore((s) => s.botState);
  const meta = BOT_STATES[botState];

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-hairline bg-black/45 px-3 py-1.5 backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <motion.span
        key={botState}
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.color }}
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.15, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="text-xs font-medium tracking-wide text-white">
        {meta.label}
      </span>
      <span className="hidden text-xs text-white/55 sm:inline">
        · {meta.hint}
      </span>
    </div>
  );
}
