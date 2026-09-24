import type { Message } from "@/types";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function stamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function exportAsJson(messages: Message[]) {
  download(
    `aivora-conversation-${stamp()}.json`,
    JSON.stringify(
      { app: "Aivora", exportedAt: new Date().toISOString(), messages },
      null,
      2,
    ),
    "application/json",
  );
}

export function exportAsMarkdown(messages: Message[]) {
  const lines = [
    "# Aivora conversation",
    "",
    `_Exported ${new Date().toLocaleString()}_`,
    "",
  ];

  for (const m of messages) {
    const who = m.sender === "user" ? "You" : "Aivora";
    const time = new Date(m.timestamp).toLocaleTimeString();
    lines.push(`## ${who} · ${time}`, "", m.text.trim(), "");
  }

  download(
    `aivora-conversation-${stamp()}.md`,
    lines.join("\n"),
    "text/markdown",
  );
}
