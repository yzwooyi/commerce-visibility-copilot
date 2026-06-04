import { clampScore, hasAny, scoreBand } from "./scoringUtils";
import { getPlatformProfile } from "./platformOptimization";
import type { ProductPageSnapshot, ScoreResult } from "./types";

export function scoreAeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const text = `${snapshot.descriptionText} ${snapshot.faqQuestions.join(" ")}`.toLowerCase();
  const profile = getPlatformProfile(snapshot.platform);

  if (snapshot.faqQuestions.length >= 5) score += 25;
  else {
    reasons.push("The page does not answer enough buyer questions.");
    topFixes.push("Add at least 5 buyer FAQ questions.");
  }

  if (hasAny(text, ["how to use", "use it", "apply", "wear", "install", "take"])) score += 15;
  else {
    reasons.push("The page does not explain how to use the product.");
    topFixes.push("Add usage guidance.");
  }

  if (hasAny(text, ["suitable", "safe", "sensitive", "pregnant", "skin type", "allergy"])) score += 15;
  else {
    reasons.push("The page does not answer suitability or safety concerns.");
    topFixes.push("Add suitability answers.");
  }

  if (hasAny(text, ["shipping", "return", "delivery", "warranty", "refund"])) score += 10;
  else {
    reasons.push("Shipping or after-sales questions are not answered.");
    topFixes.push("Add shipping or return FAQ.");
  }

  if (hasAny(text, ["compare", "different", "better than", "alternative", "versus"])) score += 10;
  else {
    reasons.push("The page does not help buyers compare alternatives.");
    topFixes.push("Add comparison FAQ.");
  }

  if (profile.sellerCanEditCode && snapshot.schemaTypes.includes("FAQPage")) score += 10;
  else if (profile.sellerCanEditCode) {
    reasons.push("FAQ answers are not exposed through FAQ schema.");
    topFixes.push("Add FAQ schema.");
  } else if (snapshot.faqQuestions.length >= 5 || hasAny(text, ["faq", "question", "q:", "a:"])) {
    score += 10;
  } else {
    reasons.push(`${profile.label} cannot rely on FAQ schema, so buyer answers must be visible in listing copy.`);
    topFixes.push("Put buyer answers directly inside the listing.");
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    band: scoreBand(finalScore),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
