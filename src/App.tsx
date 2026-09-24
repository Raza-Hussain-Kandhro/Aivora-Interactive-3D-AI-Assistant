import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, MessageSquare } from "lucide-react";
import { Viewport } from "@/components/Viewport";
import { ChatPanel } from "@/components/ChatPanel";
import { useAppStore } from "@/store/useAppStore";

/** Mobile tab bar — the split screen collapses into two accessible tabs. */
function MobileTabs() {
  const tab = useAppStore((s) => s.mobileTab);
  const setTab = useAppStore((s) => s.setMobileTab);

  const items = [
    { id: "scene" as const, label: "3D Scene", icon: Boxes },
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
  ];

  return (
    <nav
      className="flex shrink-0 gap-1.5 border-t border-hairline bg-surface/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
      role="tablist"
      aria-label="Switch between the 3D scene and the chat"
    >
      {items.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition ${
              active
                ? "bg-aivora-cyan/15 text-aivora-cyan"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  const chatOpen = useAppStore((s) => s.chatOpen);
  const setChatOpen = useAppStore((s) => s.setChatOpen);
  const mobileTab = useAppStore((s) => s.mobileTab);
  const setCustomizerOpen = useAppStore((s) => s.setCustomizerOpen);

  // Global shortcuts: Esc closes overlays, Cmd/Ctrl+K toggles the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomizerOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setChatOpen(!useAppStore.getState().chatOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setChatOpen, setCustomizerOpen]);

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      <main className="flex min-h-0 flex-1 md:flex-row">
        {/* ---------- 3D viewport ---------- */}
        <div
          id="panel-scene"
          role="tabpanel"
          aria-label="3D scene"
          className={`relative min-h-0 flex-1 ${mobileTab === "scene" ? "block" : "hidden"} md:block`}
        >
          <Viewport />
        </div>

        {/* ---------- chat: floating drawer on desktop, full panel on mobile ---------- */}
        <div
          id="panel-chat"
          role="tabpanel"
          aria-label="Chat"
          className={`min-h-0 flex-1 ${mobileTab === "chat" ? "block" : "hidden"} md:hidden`}
        >
          <ChatPanel />
        </div>

        <AnimatePresence initial={false}>
          {chatOpen && (
            <motion.div
              key="drawer"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="hidden w-[min(28rem,38vw)] shrink-0 py-4 pr-4 md:block"
            >
              <ChatPanel collapsible onCollapse={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileTabs />
    </div>
  );
}
