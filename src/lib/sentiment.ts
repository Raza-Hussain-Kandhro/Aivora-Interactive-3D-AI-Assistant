import type { Emotion } from "@/types";

/**
 * Lightweight, dependency-free sentiment classifier.
 * Runs on the assistant's final text to pick a procedural reaction.
 */
const POSITIVE = [
  "great",
  "awesome",
  "excellent",
  "perfect",
  "love",
  "happy",
  "success",
  "congrat",
  "nice",
  "amazing",
  "fantastic",
  "glad",
  "wonderful",
  "brilliant",
  "done",
  "solved",
  "works",
  "exciting",
  "thank",
  "well done",
  "🎉",
  "✅",
];

const NEGATIVE = [
  "sorry",
  "error",
  "cannot",
  "can't",
  "unable",
  "unfortunately",
  "not sure",
  "unclear",
  "confus",
  "fail",
  "problem",
  "issue",
  "invalid",
  "wrong",
  "missing",
  "unsupported",
  "don't know",
  "do not know",
  "⚠️",
];

export function analyzeSentiment(text: string): Emotion {
  const haystack = text.toLowerCase();
  let score = 0;

  for (const word of POSITIVE) if (haystack.includes(word)) score += 1;
  for (const word of NEGATIVE) if (haystack.includes(word)) score -= 1;

  // Question-heavy replies read as uncertainty.
  const questionMarks = (haystack.match(/\?/g) ?? []).length;
  if (questionMarks >= 2) score -= 1;
  if (/^\s*(hmm|i'm not|i am not)/.test(haystack)) score -= 1;

  if (score >= 2) return "happy";
  if (score <= -2) return "confused";
  return "neutral";
}

/** Strips markdown so text-to-speech doesn't read syntax aloud. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " code block. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
