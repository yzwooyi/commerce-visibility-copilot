import { getPlatformProfile } from "./platformOptimization";
import type { ChecklistItem, ProductPageSnapshot } from "./types";

export function generatePublishChecklist(snapshot: ProductPageSnapshot): ChecklistItem[] {
  const profile = getPlatformProfile(snapshot.platform);

  if (profile.category === "marketplace" || profile.category === "amazon") {
    return [
      {
        id: "marketplace-title",
        label: `Rewrite ${profile.label} product title`,
        completed: snapshot.title.trim().length >= 45
      },
      {
        id: "marketplace-description",
        label: "Expand listing description with benefits and specs",
        completed: snapshot.descriptionText.trim().length >= 350
      },
      {
        id: "marketplace-faq",
        label: "Add local buyer FAQ inside listing copy",
        completed: snapshot.faqQuestions.length >= 5
      },
      {
        id: "marketplace-suitability",
        label: "Answer suitability, safety, and usage questions",
        completed: /suitable|safe|sensitive|skin type|how to use|apply|install|wear/i.test(snapshot.descriptionText)
      },
      {
        id: "marketplace-delivery",
        label: "Add delivery, COD, return, or warranty answers",
        completed: /delivery|shipping|cod|return|refund|warranty|sabah|sarawak/i.test(snapshot.descriptionText)
      },
      {
        id: "marketplace-proof",
        label: "Add review proof, rating context, or authenticity claim",
        completed: Boolean(snapshot.visibleRating) || /review|rating|authentic|original|official/i.test(snapshot.descriptionText)
      },
      {
        id: "marketplace-comparison",
        label: "Add comparison against common alternatives",
        completed: /compare|different|alternative|versus|better than/i.test(snapshot.descriptionText)
      },
      {
        id: "marketplace-after-sales",
        label: "Check platform fields before publishing",
        completed: snapshot.visiblePrice !== undefined
      }
    ];
  }

  return [
    {
      id: "title",
      label: "Update product title",
      completed: snapshot.title.trim().length >= 25
    },
    {
      id: "meta",
      label: "Add SEO meta description",
      completed: snapshot.metaDescription.trim().length >= 80
    },
    {
      id: "description",
      label: "Expand product description",
      completed: snapshot.descriptionText.trim().length >= 250
    },
    {
      id: "faq",
      label: "Add buyer FAQ",
      completed: snapshot.faqQuestions.length >= 5
    },
    {
      id: "product-schema",
      label: "Add Product schema",
      completed: snapshot.schemaTypes.includes("Product")
    },
    {
      id: "faq-schema",
      label: "Add FAQ schema",
      completed: snapshot.schemaTypes.includes("FAQPage")
    },
    {
      id: "alt-text",
      label: "Add descriptive image alt text",
      completed: snapshot.imageAltTexts.some((alt) => alt.trim().length >= 15)
    },
    {
      id: "answer-block",
      label: "Add AI answer block",
      completed: snapshot.descriptionText.trim().length >= 350
    }
  ];
}
