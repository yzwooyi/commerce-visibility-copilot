import { clampScore, hasAny, scoreBand } from "./scoringUtils";
import { getPlatformProfile } from "./platformOptimization";
import type { ProductPageSnapshot, ScoreResult } from "./types";

export function scoreGeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const text = `${snapshot.title} ${snapshot.descriptionText} ${snapshot.h2.join(" ")}`.toLowerCase();
  const answerText = `${text} ${snapshot.faqQuestions.join(" ")}`.toLowerCase();
  const profile = getPlatformProfile(snapshot.platform);
  const isMarketplace = profile.category === "marketplace" || profile.category === "amazon";

  if (hasAny(answerText, ["for ", "best for", "suitable for", "designed for"])) score += 15;
  else {
    reasons.push("AI may not know who this product is best for.");
    topFixes.push("Add a clear target customer statement.");
  }

  if (hasAny(answerText, ["solve", "helps", "designed", "supports", "improves", "benefit"])) score += 15;
  else {
    reasons.push("The page does not clearly explain the problem this product solves.");
    topFixes.push("Explain the customer problem.");
  }

  if (snapshot.faqQuestions.length >= 2) score += 20;
  else {
    reasons.push("AI answer engines need more structured questions and answers.");
    topFixes.push("Add buyer FAQ.");
  }

  if (hasAny(answerText, ["different", "compare", "alternative", "instead of", "unlike", "versus"])) score += 15;
  else {
    reasons.push("The page does not explain how the product differs from alternatives.");
    topFixes.push("Add a comparison answer.");
  }

  if (profile.sellerCanEditCode && snapshot.schemaTypes.includes("Product")) score += 10;
  else if (profile.sellerCanEditCode) {
    reasons.push("The product entity is not exposed through Product schema.");
    topFixes.push("Add Product schema.");
  } else if (hasAny(answerText, ["brand", "official", "authentic", "original", "made in", "malaysia", "review", "rating"])) {
    score += 10;
  } else {
    reasons.push(`${profile.label} needs clearer brand, authenticity, or product positioning signals.`);
    topFixes.push("Add brand and authenticity positioning.");
  }

  if (snapshot.descriptionText.trim().length >= 450 && hasAny(answerText, ["who", "what", "why", "how", "suitable", "compare"])) score += 10;
  else {
    reasons.push("The page needs a more complete explanation for AI summarization.");
    topFixes.push("Add an AI answer block.");
  }

  let finalScore = clampScore(score);
  if (isMarketplace && snapshot.faqQuestions.length < 2 && !hasAny(answerText, ["faq", "q:", "a:"])) {
    finalScore = Math.min(finalScore, 55);
  }
  if (!hasAny(answerText, ["different", "compare", "alternative", "instead of", "unlike", "versus"])) {
    finalScore = Math.min(finalScore, 72);
  }
  if (!hasAny(answerText, ["brand", "official", "authentic", "original", "made in", "malaysia", "review", "rating"])) {
    finalScore = Math.min(finalScore, 78);
  }

  return {
    score: finalScore,
    band: scoreBand(finalScore),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
