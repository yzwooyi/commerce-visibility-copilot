import type { OutputCheckResult } from "./types";

export function checkOutput(output: string): OutputCheckResult {
  const text = output.toLowerCase();
  const issues: string[] = [];

  if (output.trim().length < 300) issues.push("Output is too short.");
  if (text.includes("great product") || text.includes("amazing and useful")) issues.push("Output is too generic.");
  if (!text.includes("faq")) issues.push("Missing FAQ content.");
  if (!text.includes("answer block")) issues.push("Missing AI answer block.");
  if (!text.includes("schema")) issues.push("Missing schema implementation notes.");
  if (!text.includes("suitable") && !text.includes("best for") && !text.includes("designed for")) {
    issues.push("Missing target customer or suitability answer.");
  }

  return {
    status: issues.length === 0 ? "ready_to_publish" : "needs_improvement",
    issues
  };
}
