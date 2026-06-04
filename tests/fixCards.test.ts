import { describe, expect, it } from "vitest";
import { buildBeginnerFixCards } from "../shared/fixCards";
import { generatePublishChecklist } from "../shared/checklist";
import type { ProductPageSnapshot } from "../shared/types";

const shopeeSnapshot: ProductPageSnapshot = {
  url: "https://shopee.com.my/product/123/456",
  platform: "shopee",
  title: "Glow Serum",
  metaTitle: "Glow Serum",
  metaDescription: "",
  h1: ["Glow Serum"],
  h2: [],
  descriptionText: "Nice serum.",
  imageAltTexts: [],
  faqQuestions: [],
  schemaTypes: []
};

describe("beginner fix cards", () => {
  it("turns Shopee checklist gaps into seller-friendly Claude tasks", () => {
    const cards = buildBeginnerFixCards(shopeeSnapshot, generatePublishChecklist(shopeeSnapshot));
    const titleCard = cards.find((card) => card.id === "marketplace-title");
    const faqCard = cards.find((card) => card.id === "marketplace-faq");
    const deliveryCard = cards.find((card) => card.id === "marketplace-delivery");

    expect(titleCard?.title).toBe("Fix title");
    expect(titleCard?.claudeTask).toContain("Shopee MY");
    expect(titleCard?.checkRules).toContain("Has product type");
    expect(faqCard?.plainIssue).toContain("Local buyer questions");
    expect(deliveryCard?.pasteLocation).toContain("Delivery");
  });
});
