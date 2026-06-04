import type { ScoreBand } from "./types";

export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 45) return "needs_work";
  return "weak";
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function hasAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}
