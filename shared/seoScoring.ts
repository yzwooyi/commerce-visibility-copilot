import { clampScore, hasAny, scoreBand } from "./scoringUtils";
import { getPlatformProfile } from "./platformOptimization";
import type { ProductPageSnapshot, ScoreResult } from "./types";

export function scoreSeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const profile = getPlatformProfile(snapshot.platform);
  const marketplaceText = `${snapshot.title} ${snapshot.descriptionText} ${snapshot.faqQuestions.join(" ")}`.toLowerCase();

  if (profile.category === "marketplace" || profile.category === "amazon") {
    score = 8;

    if (snapshot.title.trim().length >= 55) score += 18;
    else if (snapshot.title.trim().length >= 35) score += 10;
    else {
      reasons.push(`${profile.label} needs a clearer keyword-rich product title.`);
      topFixes.push("Rewrite the marketplace product title.");
    }

    if (snapshot.descriptionText.trim().length >= 650) score += 18;
    else if (snapshot.descriptionText.trim().length >= 350) score += 10;
    else {
      reasons.push("The listing description is too thin for marketplace search and buyer decisions.");
      topFixes.push("Expand the marketplace product description.");
    }

    if (snapshot.faqQuestions.length >= 5 || hasAny(marketplaceText, ["faq", "q:", "a:", "question"])) score += 12;
    else {
      reasons.push("The listing is missing buyer questions that marketplace shoppers ask before checkout.");
      topFixes.push("Add marketplace buyer FAQ.");
    }

    if (hasAny(marketplaceText, ["delivery", "shipping", "cod", "return", "refund", "warranty", "sabah", "sarawak"])) score += 10;
    else {
      reasons.push("The listing does not clearly answer delivery, COD, return, or warranty concerns.");
      topFixes.push("Add delivery and after-sales answers.");
    }

    if (hasAny(marketplaceText, ["suitable", "safe", "sensitive", "skin type", "how to use", "apply", "install", "wear"])) score += 10;
    else {
      reasons.push("The listing does not clearly answer suitability, safety, or usage questions.");
      topFixes.push("Add suitability and usage answers.");
    }

    if (hasAny(marketplaceText, ["review", "rating", "authentic", "original", "official"])) score += 8;
    else {
      reasons.push("The listing lacks review, rating, authenticity, or seller trust proof.");
      topFixes.push("Add trust proof.");
    }

    if (hasAny(marketplaceText, ["compare", "different", "alternative", "versus", "better than"])) score += 8;
    else {
      reasons.push("The listing does not explain how the product differs from alternatives.");
      topFixes.push("Add a comparison answer.");
    }

    if (snapshot.visiblePrice) score += 5;
    else {
      reasons.push("The scan could not confirm a visible price.");
      topFixes.push("Confirm price and offer visibility.");
    }

    if (snapshot.visibleRating) score += 5;
    else {
      reasons.push("The scan could not confirm visible rating or review proof.");
      topFixes.push("Add review proof or rating context where the platform allows.");
    }

    if (snapshot.imageAltTexts.some((alt) => alt.trim().length >= 15) || snapshot.descriptionText.length >= 500) {
      score += 4;
    } else {
      reasons.push("The listing needs clearer image/product detail cues.");
      topFixes.push("Improve image captions or product detail fields.");
    }

    let finalScore = clampScore(score);
    if (snapshot.faqQuestions.length < 3 && !hasAny(marketplaceText, ["faq", "q:", "a:"])) {
      finalScore = Math.min(finalScore, 68);
    }
    if (!hasAny(marketplaceText, ["delivery", "shipping", "cod", "return", "refund", "warranty"])) {
      finalScore = Math.min(finalScore, 78);
    }
    if (!hasAny(marketplaceText, ["review", "rating", "authentic", "original", "official"])) {
      finalScore = Math.min(finalScore, 84);
    }

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
