import { clampScore, scoreBand } from "./scoringUtils";
import { getPlatformProfile } from "./platformOptimization";
import type { ProductPageSnapshot, ScoreResult } from "./types";

export function scoreSeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const profile = getPlatformProfile(snapshot.platform);

  if (profile.category === "marketplace" || profile.category === "amazon") {
    if (snapshot.title.trim().length >= 45) score += 25;
    else {
      reasons.push(`${profile.label} needs a clearer keyword-rich product title.`);
      topFixes.push("Rewrite the marketplace product title.");
    }

    if (snapshot.descriptionText.trim().length >= 350) score += 25;
    else {
      reasons.push("The listing description is too thin for marketplace search and buyer decisions.");
      topFixes.push("Expand the marketplace product description.");
    }

    if (snapshot.faqQuestions.length >= 3) score += 15;
    else {
      reasons.push("The listing is missing buyer questions that marketplace shoppers ask before checkout.");
      topFixes.push("Add marketplace buyer FAQ.");
    }

    if (snapshot.visiblePrice) score += 10;
    else {
      reasons.push("The scan could not confirm a visible price.");
      topFixes.push("Confirm price and offer visibility.");
    }

    if (snapshot.visibleRating) score += 10;
    else {
      reasons.push("The scan could not confirm visible rating or review proof.");
      topFixes.push("Add review proof or rating context where the platform allows.");
    }

    if (snapshot.imageAltTexts.some((alt) => alt.trim().length >= 15) || snapshot.descriptionText.length >= 500) {
      score += 10;
    } else {
      reasons.push("The listing needs clearer image/product detail cues.");
      topFixes.push("Improve image captions or product detail fields.");
    }

    const finalScore = clampScore(score);
    return {
      score: finalScore,
      band: scoreBand(finalScore),
      reasons,
      topFixes: topFixes.slice(0, 3)
    };
  }

  if (snapshot.metaDescription.trim().length >= 80) score += 15;
  else {
    reasons.push("The page is missing a useful meta description.");
    topFixes.push("Add a meta description.");
  }

  if (snapshot.schemaTypes.includes("Product") && snapshot.schemaTypes.includes("FAQPage")) score += 20;
  else {
    reasons.push("The page is missing Product or FAQ structured data.");
    topFixes.push("Add Product and FAQ schema.");
  }

  if (snapshot.title.trim().length >= 25) score += 10;
  else {
    reasons.push("The product title is too short to explain what the product is for.");
    topFixes.push("Improve the product title.");
  }

  if (snapshot.h1.length === 1 && snapshot.h1[0].trim().length >= 20) score += 10;
  else {
    reasons.push("The H1 does not clearly describe the product.");
    topFixes.push("Improve the H1.");
  }

  if (snapshot.h2.length >= 2) score += 10;
  else {
    reasons.push("The page needs clearer sections for buyers and crawlers.");
    topFixes.push("Add useful H2 sections.");
  }

  if (snapshot.descriptionText.trim().length >= 250) score += 15;
  else {
    reasons.push("The product description is too thin.");
    topFixes.push("Expand the product description.");
  }

  if (snapshot.imageAltTexts.some((alt) => alt.trim().length >= 15)) score += 10;
  else {
    reasons.push("Product images are missing useful alt text.");
    topFixes.push("Add descriptive image alt text.");
  }

  const finalScore = clampScore(score);
  return {
    score: finalScore,
    band: scoreBand(finalScore),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
