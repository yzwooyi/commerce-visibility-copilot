import { describe, expect, it } from "vitest";
import { scoreAeo } from "../shared/aeoScoring";
import { scoreGeo } from "../shared/geoScoring";
import { scoreSeo } from "../shared/seoScoring";
import { generatePublishChecklist } from "../shared/checklist";
import type { ProductPageSnapshot } from "../shared/types";

const weakSnapshot: ProductPageSnapshot = {
  url: "https://example.com/product",
  platform: "independent",
  title: "Glow Serum",
  metaTitle: "",
  metaDescription: "",
  h1: ["Glow Serum"],
  h2: [],
  descriptionText: "A nice serum.",
  imageAltTexts: ["", ""],
  faqQuestions: [],
  schemaTypes: []
};

const strongSnapshot: ProductPageSnapshot = {
  url: "https://example.com/product",
  platform: "shopify",
  title: "Hydrating Glow Serum for Dry Sensitive Skin",
  metaTitle: "Hydrating Glow Serum for Dry Skin",
  metaDescription:
    "Shop a hydrating glow serum for dry and sensitive skin with clear usage guidance and buyer FAQs.",
  h1: ["Hydrating Glow Serum for Dry Sensitive Skin"],
  h2: ["Who it is for", "How to use", "FAQ"],
  descriptionText:
    "This hydrating serum is designed for dry and sensitive skin. It helps improve glow, supports daily routines, and works in humid weather. It is best for buyers who want a gentle product with clear usage instructions. It is different from heavier oils because it absorbs quickly and can compare well against alternatives for everyday use. Shipping and return details are included for buyers.",
  imageAltTexts: ["Hydrating glow serum bottle for dry sensitive skin"],
  faqQuestions: [
    "Is this suitable for sensitive skin?",
    "How often should I use it?",
    "How does it compare to face oil?",
    "Can I return it?",
    "Is shipping available?"
  ],
  schemaTypes: ["Product", "Offer", "FAQPage", "BreadcrumbList"],
  visiblePrice: "$29"
};

describe("visibility scoring", () => {
  it("scores weak pages below strong pages", () => {
    expect(scoreSeo(weakSnapshot).score).toBeLessThan(scoreSeo(strongSnapshot).score);
    expect(scoreGeo(weakSnapshot).score).toBeLessThan(scoreGeo(strongSnapshot).score);
    expect(scoreAeo(weakSnapshot).score).toBeLessThan(scoreAeo(strongSnapshot).score);
  });

  it("returns clear top fixes for weak SEO pages", () => {
    const result = scoreSeo(weakSnapshot);
    expect(result.topFixes).toContain("Add a meta description.");
    expect(result.topFixes).toContain("Add Product and FAQ schema.");
  });

  it("uses marketplace-specific SEO fixes instead of schema fixes for Shopee", () => {
    const shopeeSnapshot: ProductPageSnapshot = {
      ...weakSnapshot,
      url: "https://shopee.com.my/example-product",
      platform: "shopee"
    };

    const result = scoreSeo(shopeeSnapshot);
    expect(result.topFixes).toContain("Rewrite the marketplace product title.");
    expect(result.topFixes).not.toContain("Add Product and FAQ schema.");

    const checklist = generatePublishChecklist(shopeeSnapshot).map((item) => item.label);
    expect(checklist).toContain("Rewrite Shopee MY product title");
    expect(checklist).not.toContain("Add Product schema");
  });

  it("does not inflate Shopee scores from long listing text alone", () => {
    const shopeeSnapshot: ProductPageSnapshot = {
      ...weakSnapshot,
      url: "https://shopee.com.my/example-product",
      platform: "shopee",
      title: "Hydrating Glow Serum for Dry Sensitive Skin Malaysia 30ml",
      descriptionText:
        "This product has a long description with many product details and benefits. ".repeat(14),
      visiblePrice: "RM29.90",
      visibleRating: "4.8"
    };

    expect(scoreSeo(shopeeSnapshot).score).toBeLessThan(70);
    expect(scoreGeo(shopeeSnapshot).score).toBeLessThanOrEqual(55);
    expect(scoreAeo(shopeeSnapshot).score).toBeLessThan(45);
  });
});
