import { getPlatformProfile } from "./platformOptimization";
import type { GeneratedFixPack, ProductPageSnapshot } from "./types";

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function productName(snapshot: ProductPageSnapshot): string {
  return clean(snapshot.title) || "Your product";
}

function compactBenefit(snapshot: ProductPageSnapshot): string {
  const text = clean(snapshot.descriptionText);
  if (!text) return "Clear benefits, practical usage, and local buyer support.";
  const sentence = text.split(/[.!?]/).map(clean).find((part) => part.length >= 20);
  return sentence || text.slice(0, 120);
}

function marketplaceTitle(snapshot: ProductPageSnapshot): string {
  const base = productName(snapshot)
    .replace(/\b(shopee|lazada|tiktok shop)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const suffix = snapshot.platform === "shopee" ? "Malaysia Ready" : "Official Malaysia Listing";
  const title = `${base} | Benefits, Specs, Easy Use, ${suffix}`;
  return title.length > 118 ? title.slice(0, 115).trim() + "..." : title;
}

function faqBlock(snapshot: ProductPageSnapshot): string {
  const name = productName(snapshot);
  const existing = snapshot.faqQuestions.slice(0, 4);
  const questions = [
    ...existing,
    `Who is ${name} suitable for?`,
    `How do I use ${name}?`,
    "Is COD or local delivery available?",
    "What should I check before ordering?",
    "How is this different from common alternatives?"
  ];
  return Array.from(new Set(questions))
    .slice(0, 8)
    .map((question) => {
      if (/cod|delivery|shipping/i.test(question)) {
        return `Q: ${question}\nA: Delivery, COD, return, and warranty details should follow the seller's confirmed Shopee/Lazada/TikTok policy. Please confirm the exact option before publishing.`;
      }
      if (/different|alternative|compare/i.test(question)) {
        return `Q: ${question}\nA: Choose this if you want ${compactBenefit(snapshot)}. Compare size, ingredients/materials, warranty, and seller proof before buying.`;
      }
      if (/use|how/i.test(question)) {
        return `Q: ${question}\nA: Follow the product instructions, use the recommended amount or setup steps, and contact the seller if you are unsure.`;
      }
      if (/suitable|safe|who/i.test(question)) {
        return `Q: ${question}\nA: It is suitable for buyers looking for ${compactBenefit(snapshot)}. If you have allergies, sensitive conditions, or special requirements, confirm with the seller first.`;
      }
      return `Q: ${question}\nA: This answer should be confirmed with the seller's real product details before publishing.`;
    })
    .join("\n\n");
}

function marketplaceDescription(snapshot: ProductPageSnapshot): string {
  const name = productName(snapshot);
  const benefit = compactBenefit(snapshot);
  return `Why buyers choose ${name}
- ${benefit}
- Clear product details so buyers know what they are ordering.
- Suitable for Malaysia buyers who want practical product information before checkout.
- Seller can add confirmed delivery, COD, return, and warranty details below.

Benefits
- Helps buyers quickly understand the product purpose.
- Makes comparison easier before checkout.
- Reduces repeated chat questions about usage, suitability, delivery, and after-sales.

Specifications
- Product name: ${name}
- Price shown: ${snapshot.visiblePrice || "Confirm in Seller Centre"}
- Rating/review proof: ${snapshot.visibleRating || "Add real rating/review proof if available"}
- Package includes: Confirm exact package contents before publishing

How to use
1. Check the product details and suitability notes.
2. Follow the seller's instructions or care guide.
3. Contact the seller before ordering if you need confirmation.

Buyer notes
- Confirm variant, size, color, quantity, and delivery option before checkout.
- Do not add medical, safety, or warranty claims unless they are verified.`;
}

function deliveryBlock(): string {
  return `Delivery / COD / Return / Warranty
- Delivery: Confirm estimated delivery time in Seller Centre.
- COD: Add "COD available" only if the platform shows it for this listing.
- Sabah/Sarawak: Confirm delivery coverage and extra timing if relevant.
- Return/refund: Follow the platform return policy and seller policy.
- Warranty: Add warranty period only if the product truly includes it.
- After-sales: Buyers can chat with the seller for usage, variant, or order questions.`;
}

function trustBlock(snapshot: ProductPageSnapshot): string {
  return `Trust proof
- Rating/review signal: ${snapshot.visibleRating || "Add real rating or review summary if available."}
- Authenticity: Use "authentic/original/official" only if you can prove it.
- Seller assurance: Product details, package contents, and after-sales answers are clearly listed.
- Buyer reminder: Please check variants, delivery option, and seller chat before checkout.`;
}

function comparisonBlock(snapshot: ProductPageSnapshot): string {
  const name = productName(snapshot);
  return `Simple comparison
- Choose ${name} if you want: ${compactBenefit(snapshot)}
- Choose alternatives if you need: different size, different material/ingredients, lower price, or a different warranty.
- Best for: buyers who want clear product details, usage guidance, and local after-sales answers before checkout.`;
}

function ownedStorePack(snapshot: ProductPageSnapshot): GeneratedFixPack {
  const name = productName(snapshot);
  return {
    summary: "Ready-to-paste website page sections for SEO, GEO, and AEO.",
    blocks: [
      {
        id: "seo-title",
        label: "SEO title",
        pasteLocation: "Product page SEO title / H1",
        content: `${name} | Benefits, Specs, Usage Guide and FAQ`
      },
      {
        id: "meta-description",
        label: "Meta description",
        pasteLocation: "SEO settings > Meta description",
        content: `Shop ${name}. See benefits, specifications, usage guidance, buyer FAQ, delivery notes, and comparison details before checkout.`.slice(0, 155)
      },
      {
        id: "answer-block",
        label: "AI answer block",
        pasteLocation: "Top of product description",
        content: `${name} is for buyers who want ${compactBenefit(snapshot)} The page should explain who it is for, how to use it, what is included, delivery and return details, and how it compares with alternatives.`
      },
      {
        id: "faq",
        label: "Buyer FAQ",
        pasteLocation: "Product page FAQ section",
        content: faqBlock(snapshot)
      }
    ]
  };
}

function marketplacePack(snapshot: ProductPageSnapshot): GeneratedFixPack {
  const profile = getPlatformProfile(snapshot.platform);
  return {
    summary: `Ready-to-paste ${profile.label} listing blocks. Confirm policy and proof before publishing.`,
    blocks: [
      {
        id: "marketplace-title",
        label: "Product title",
        pasteLocation: `${profile.label} Seller Centre > Product name`,
        content: marketplaceTitle(snapshot)
      },
      {
        id: "marketplace-description",
        label: "Listing description",
        pasteLocation: `${profile.label} Seller Centre > Product description`,
        content: marketplaceDescription(snapshot)
      },
      {
        id: "marketplace-faq",
        label: "Buyer FAQ",
        pasteLocation: "Bottom of listing description / chat replies",
        content: faqBlock(snapshot)
      },
      {
        id: "marketplace-delivery",
        label: "Delivery and after-sales",
        pasteLocation: "Listing description > Delivery / Warranty section",
        content: deliveryBlock()
      },
      {
        id: "marketplace-proof",
        label: "Trust proof",
        pasteLocation: "Listing description > Why buy from us",
        content: trustBlock(snapshot)
      },
      {
        id: "marketplace-comparison",
        label: "Comparison",
        pasteLocation: "Listing description > Why this product",
        content: comparisonBlock(snapshot)
      }
    ]
  };
}

export function generateFixOutputPack(snapshot: ProductPageSnapshot): GeneratedFixPack {
  const profile = getPlatformProfile(snapshot.platform);
  return profile.category === "owned_store" ? ownedStorePack(snapshot) : marketplacePack(snapshot);
}
