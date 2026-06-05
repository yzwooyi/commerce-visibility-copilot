import { describe, expect, it } from "vitest";
import { generateFixOutputPack } from "../shared/fixOutput";
import type { ProductPageSnapshot } from "../shared/types";

const snapshot: ProductPageSnapshot = {
  url: "https://shopee.com.my/product/123",
  platform: "shopee",
  title: "Glow Serum 30ml",
  metaTitle: "",
  metaDescription: "",
  h1: ["Glow Serum 30ml"],
  h2: [],
  descriptionText: "A serum for daily skincare routines.",
  imageAltTexts: [],
  faqQuestions: ["Is it suitable for sensitive skin?"],
  schemaTypes: [],
  visiblePrice: "RM29.90"
};

describe("fix output pack", () => {
  it("generates ready-to-paste marketplace blocks", () => {
    const pack = generateFixOutputPack(snapshot);

    expect(pack.summary).toContain("Shopee MY");
    expect(pack.blocks.map((block) => block.id)).toContain("marketplace-title");
    expect(pack.blocks.map((block) => block.id)).toContain("marketplace-description");
    expect(pack.blocks.map((block) => block.id)).toContain("marketplace-faq");
    expect(pack.blocks.find((block) => block.id === "marketplace-faq")?.content).toContain("Q:");
  });
});
