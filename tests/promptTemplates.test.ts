import { describe, expect, it } from "vitest";
import { generateFixPrompts } from "../shared/promptTemplates";
import type { ProductPageSnapshot } from "../shared/types";

const snapshot: ProductPageSnapshot = {
  url: "https://example.com/product",
  platform: "independent",
  title: "Glow Serum",
  metaTitle: "",
  metaDescription: "",
  h1: ["Glow Serum"],
  h2: [],
  descriptionText: "A nice serum.",
  imageAltTexts: [],
  faqQuestions: [],
  schemaTypes: []
};

describe("prompt templates", () => {
  it("generates Claude and Codex prompts with product data", () => {
    const prompts = generateFixPrompts(snapshot);
    expect(prompts.claudePrompt).toContain("Glow Serum");
    expect(prompts.claudePrompt).toContain("SEO, GEO, and AEO");
    expect(prompts.codexPrompt).toContain("Product schema");
    expect(prompts.codexPrompt).toContain("https://example.com/product");
  });

  it("generates marketplace-specific prompts for Shopee", () => {
    const prompts = generateFixPrompts({
      ...snapshot,
      url: "https://shopee.com.my/product/123",
      platform: "shopee"
    });

    expect(prompts.claudePrompt).toContain("Shopee MY");
    expect(prompts.claudePrompt.toLowerCase()).toContain("marketplace product title");
    expect(prompts.codexPrompt).toContain("marketplace listing");
    expect(prompts.codexPrompt).toContain("Exact marketplace fields to update");
    expect(prompts.codexPrompt).toContain("Do not ask the seller to add JSON-LD schema");
  });

  it("includes scan evidence so optimization is based on confirmed page data", () => {
    const prompts = generateFixPrompts({
      ...snapshot,
      scanEvidence: {
        scannedAt: "2026-06-05T00:00:00.000Z",
        titleSource: "h1",
        descriptionSource: "product detail selector",
        imageCount: 6,
        descriptionLength: 420,
        bodyTextLength: 6200,
        foundFields: ["title", "description/body text", "images"],
        missingFields: ["buyer FAQ/questions", "rating/review signal"],
        textSources: ["main", "section"]
      }
    });

    expect(prompts.claudePrompt).toContain("Scan evidence:");
    expect(prompts.claudePrompt).toContain("Found fields: title, description/body text, images");
    expect(prompts.claudePrompt).toContain("Missing fields: buyer FAQ/questions, rating/review signal");
    expect(prompts.codexPrompt).toContain("Description source: product detail selector");
  });
});
