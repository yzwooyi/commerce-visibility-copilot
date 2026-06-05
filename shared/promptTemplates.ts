import { getPlatformProfile } from "./platformOptimization";
import type { FixPrompts, ProductPageSnapshot } from "./types";

function productData(snapshot: ProductPageSnapshot): string {
  const evidence = snapshot.scanEvidence;
  return [
    `URL: ${snapshot.url || "Not provided"}`,
    `Platform: ${snapshot.platform}`,
    `Title: ${snapshot.title || "Missing"}`,
    `Meta title: ${snapshot.metaTitle || "Missing"}`,
    `Meta description: ${snapshot.metaDescription || "Missing"}`,
    `H1: ${snapshot.h1.join(" | ") || "Missing"}`,
    `H2: ${snapshot.h2.join(" | ") || "Missing"}`,
    `Description: ${snapshot.descriptionText || "Missing"}`,
    `FAQ questions: ${snapshot.faqQuestions.join(" | ") || "Missing"}`,
    `Schema types: ${snapshot.schemaTypes.join(" | ") || "Missing"}`,
    `Visible price: ${snapshot.visiblePrice || "Missing"}`,
    `Visible rating: ${snapshot.visibleRating || "Missing"}`,
    evidence
      ? [
          "",
          "Scan evidence:",
          `- Title source: ${evidence.titleSource}`,
          `- Description source: ${evidence.descriptionSource}`,
          `- Description length: ${evidence.descriptionLength}`,
          `- Body text length scanned: ${evidence.bodyTextLength}`,
          `- Images found: ${evidence.imageCount}`,
          `- Found fields: ${evidence.foundFields.join(", ") || "None"}`,
          `- Missing fields: ${evidence.missingFields.join(", ") || "None"}`,
          `- Text sources checked: ${evidence.textSources.join(", ") || "Not confirmed"}`
        ].join("\n")
      : "Scan evidence: Manual input or older scan; evidence not available."
  ].join("\n");
}

export function generateFixPrompts(snapshot: ProductPageSnapshot): FixPrompts {
  const data = productData(snapshot);
  const profile = getPlatformProfile(snapshot.platform);

  if (profile.category === "marketplace" || profile.category === "amazon") {
    const claudePrompt = `You are an ecommerce marketplace listing strategist for ${profile.label}. Improve this listing for marketplace search, AI recommendation, and buyer questions.

Product data:
${data}

Platform focus:
${profile.focusAreas.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Create copy the seller can paste into the platform admin:
1. Marketplace product title with important buyer/search keywords.
2. Short first-screen selling points.
3. Improved product description with benefits, specifications, and local Malaysia buyer language where relevant.
4. 8 buyer-focused FAQ questions and answers.
5. Suitability, safety, usage, delivery, COD, return, warranty, and after-sales answers.
6. Comparison paragraph against common alternatives.
7. Buyer question map grouped by purchase intent, suitability, usage, safety, comparison, value, delivery, and after-sales.

Do not suggest JSON-LD schema, HTML edits, or website source-code changes unless this is also an owned store. Keep the writing natural, specific, and useful.`;

    const codexPrompt = `You are preparing a platform-specific ecommerce optimization task for ${profile.label}. This is a marketplace listing, so do not assume the seller can edit website source code or add JSON-LD schema.

Product page:
${snapshot.url || "No URL provided"}

Current page data:
${data}

Create a seller-ready implementation pack:
1. Exact marketplace fields to update.
2. New product title.
3. Bullet selling points.
4. Product description section.
5. Product attributes/specification checklist.
6. FAQ block to paste into listing content or chat replies.
7. Delivery, COD, warranty, return, and after-sales answers.
8. What to verify after publishing inside ${profile.label}.
9. What cannot be changed on this marketplace and should not be promised.

Avoid these tasks:
${profile.avoidTasks.map((item) => `- ${item}`).join("\n")}

After implementation, report which fields were updated, which buyer questions were covered, and what still needs platform/admin confirmation.`;

    return { claudePrompt, codexPrompt };
  }

  const claudePrompt = `You are an ecommerce SEO, GEO, and AEO strategist. Rewrite this product page so it is clear for buyers, search engines, and AI answer engines.

Product data:
${data}

Create:
1. SEO product title.
2. Meta title under 60 characters.
3. Meta description under 155 characters.
4. Improved product description.
5. 8 buyer-focused FAQ questions and answers.
6. A short AI answer block explaining who this product is for, what problem it solves, and why it is different.
7. Suggested image alt text.
8. A comparison paragraph against common alternatives.
9. A buyer question map grouped by purchase intent, suitability, usage, safety, comparison, value, and after-sales.

Keep the writing natural, specific, and useful. Avoid generic AI-sounding claims.`;

  const codexPrompt = `You are improving an ecommerce product page for SEO, GEO, and AEO.

Product page:
${snapshot.url || "No URL provided"}

Tasks:
1. Update metadata: title and meta description.
2. Improve the page H1/H2 structure.
3. Add or update image alt text.
4. Add a buyer FAQ section.
5. Add Product schema JSON-LD.
6. Add Offer schema fields when price and availability exist.
7. Add FAQPage schema for the FAQ section.
8. Add Breadcrumb schema when breadcrumbs exist.
9. Ensure all structured data is crawlable in rendered HTML.
10. Verify the mobile layout and make sure no text overlaps or clips.

Current page data:
${data}

After implementation, report files changed, metadata updated, schema added, FAQ added, tests or checks run, and remaining risks.`;

  return { claudePrompt, codexPrompt };
}
