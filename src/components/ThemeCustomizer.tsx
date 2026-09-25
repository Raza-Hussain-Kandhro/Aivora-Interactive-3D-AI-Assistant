import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  FileJson,
  Palette,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ACCENTS, BODY_FINISHES, THEME_LIST } from "@/lib/themes";
import { exportAsJson, exportAsMarkdown } from "@/lib/exporters";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Swatch({
  color,
  label,
  active,
  onClick,
}: {
  color: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 transition ${
        active ? "border-white" : "border-transparent hover:border-white/30"
      }`}
    >
      <span className="h-7 w-7 rounded-lg" style={{ backgroundColor: color }} />
    </button>
  );
}

export function ThemeCustomizer() {
  const open = useAppStore((s) => s.customizerOpen);
  const setOpen = useAppStore((s) => s.setCustomizerOpen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accent = useAppStore((s) => s.accentColor);
  const setAccent = useAppStore((s) => s.setAccentColor);
  const bodyColor = useAppStore((s) => s.bodyColor);
  const setBodyColor = useAppStore((s) => s.setBodyColor);
  const isMuted = useAppStore((s) => s.isMuted);
  const toggleMute = useAppStore((s) => s.toggleMute);
  const messages = useAppStore((s) => s.messages);
  const clearMessages = useAppStore((s) => s.clearMessages);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="customizer"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="scroll-area absolute bottom-16 left-4 z-20 max-h-[70%] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-hairline bg-surface/95 p-4 shadow-soft backdrop-blur-xl"
          role="dialog"
          aria-label="Scene and session settings"
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              <Palette size={15} className="text-aivora-cyan" /> Customize
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            <Section title="Environment">
              <div className="grid gap-1.5">
                {THEME_LIST.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setTheme(preset.id)}
                    aria-pressed={theme === preset.id}
                    className={`flex min-h-[44px] items-center gap-3 rounded-xl border px-3 text-left text-sm transition ${
                      theme === preset.id
                        ? "border-aivora-cyan/60 bg-aivora-cyan/10 text-white"
                        : "border-hairline bg-white/[0.03] text-white/75 hover:bg-white/[0.07]"
                    }`}
                  >
                    <span
                      className="h-6 w-6 rounded-md border border-white/15"
                      style={{
                        background: `linear-gradient(135deg, ${preset.background[0]}, ${preset.background[1]})`,
                      }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Accent glow">
              <div className="flex flex-wrap gap-1">
                {ACCENTS.map((c) => (
                  <Swatch
                    key={c.value}
                    color={c.value}
                    label={`${c.label} accent`}
                    active={accent.toLowerCase() === c.value.toLowerCase()}
                    onClick={() => setAccent(c.value)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Metallic finish">
              <div className="flex flex-wrap gap-1">
                {BODY_FINISHES.map((c) => (
                  <Swatch
                    key={c.value}
                    color={c.value}
                    label={`${c.label} finish`}
                    active={bodyColor.toLowerCase() === c.value.toLowerCase()}
                    onClick={() => setBodyColor(c.value)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Voice">
              <button
                type="button"
                onClick={toggleMute}
                aria-pressed={isMuted}
                className="flex min-h-[44px] w-full items-center justify-between rounded-xl border border-hairline bg-white/[0.03] px-3 text-sm text-white/80 transition hover:bg-white/[0.07]"
              >
                <span>
                  {isMuted ? "Speech output muted" : "Speech output on"}
                </span>
                {isMuted ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} className="text-aivora-cyan" />
                )}
              </button>
            </Section>

            <Section title="Session">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => exportAsJson(messages)}
                  disabled={messages.length === 0}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-hairline bg-white/[0.03] text-xs text-white/80 transition hover:bg-white/[0.07] disabled:opacity-40"
                >
                  <FileJson size={14} /> JSON
                </button>
                <button
                  type="button"
                  onClick={() => exportAsMarkdown(messages)}
                  disabled={messages.length === 0}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-hairline bg-white/[0.03] text-xs text-white/80 transition hover:bg-white/[0.07] disabled:opacity-40"
                >
                  <Download size={14} /> Markdown
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear the saved conversation?"))
                      clearMessages();
                  }}
                  disabled={messages.length === 0}
                  className="col-span-2 flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-aivora-danger/40 bg-aivora-danger/10 text-xs text-aivora-danger transition hover:bg-aivora-danger/20 disabled:opacity-40"
                >
                  <Trash2 size={14} /> Clear history
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/70">
                {messages.length} message{messages.length === 1 ? "" : "s"}{" "}
                saved locally
              </p>
            </Section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
