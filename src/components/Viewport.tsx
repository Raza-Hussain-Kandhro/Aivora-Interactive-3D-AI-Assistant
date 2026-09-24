import { Boxes, MessageSquare, Palette } from "lucide-react";
import Scene from "@/three/Scene";
import { StateBadge } from "./StateBadge";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { useAppStore } from "@/store/useAppStore";

/** 3D viewport with floating overlays: brand, live state, customizer trigger. */
export function Viewport() {
  const customizerOpen = useAppStore((s) => s.customizerOpen);
  const setCustomizerOpen = useAppStore((s) => s.setCustomizerOpen);
  const chatOpen = useAppStore((s) => s.chatOpen);
  const setChatOpen = useAppStore((s) => s.setChatOpen);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Scene />

      {/* brand */}
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-black/45 text-aivora-cyan backdrop-blur">
          <Boxes size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight text-white">
            Aivora
          </p>
          <p className="text-[11px] leading-tight text-white/55">
            Interactive 3D AI Assistant
          </p>
        </div>
      </div>

      {/* live state pill */}
      <div className="absolute right-4 top-4 z-10">
        <StateBadge />
      </div>

      {/* bottom controls */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCustomizerOpen(!customizerOpen)}
          aria-expanded={customizerOpen}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-hairline bg-black/50 px-3.5 text-sm text-white/85 backdrop-blur transition hover:bg-black/70 hover:text-white"
        >
          <Palette size={16} className="text-aivora-cyan" /> Customize
        </button>

        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="hidden min-h-[44px] items-center gap-2 rounded-xl border border-hairline bg-black/50 px-3.5 text-sm text-white/85 backdrop-blur transition hover:bg-black/70 hover:text-white md:flex"
          >
            <MessageSquare size={16} className="text-aivora-cyan" /> Open chat
          </button>
        )}
      </div>

      {/* interaction hint */}
      <p className="pointer-events-none absolute bottom-5 right-4 z-10 hidden max-w-[16rem] text-right text-[11px] leading-snug text-white/40 lg:block">
        Drag to orbit · scroll to zoom · click the head or chest core for a
        reaction
      </p>

      <ThemeCustomizer />
    </div>
  );
}
