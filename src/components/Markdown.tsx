import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-hairline bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-hairline px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/50">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex min-h-[28px] items-center gap-1 rounded-md px-2 text-[11px] text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          background: "transparent",
          fontSize: 13,
          padding: "12px 14px",
        }}
        wrapLongLines
      >
        {value.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

/** Markdown renderer with GFM tables/task lists and syntax-highlighted code. */
export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="md text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const value = String(children);
            const match = /language-(\w+)/.exec(className ?? "");
            const isBlock = value.includes("\n") || Boolean(match);
            if (!isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1] ?? ""} value={value} />;
          },
          a({ children, ...props }) {
            return (
              <a {...props} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="scroll-area overflow-x-auto">
                <table>{children}</table>
              </div>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});
