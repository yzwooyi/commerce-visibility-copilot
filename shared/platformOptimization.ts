import type { Platform } from "./types";

export type PlatformCategory = "owned_store" | "marketplace" | "amazon" | "unknown";

export interface PlatformOptimizationProfile {
  category: PlatformCategory;
  label: string;
  primaryGoal: string;
  sellerCanEditCode: boolean;
  focusAreas: string[];
  avoidTasks: string[];
}

const marketplacePlatforms: Platform[] = ["shopee", "lazada", "tiktok_shop"];
const ownedStorePlatforms: Platform[] = ["shopify", "woocommerce", "independent"];

export function getPlatformProfile(platform: Platform): PlatformOptimizationProfile {
  if (ownedStorePlatforms.includes(platform)) {
    return {
      category: "owned_store",
      label:
        platform === "shopify"
          ? "Shopify / owned store"
          : platform === "woocommerce"
            ? "WooCommerce / owned store"
            : "Independent store",
      primaryGoal: "Make the product page crawlable, structured, and easy for AI/search engines to quote.",
      sellerCanEditCode: true,
      focusAreas: [
        "SEO title and meta description",
        "H1/H2 page structure",
        "Product, Offer, FAQ, and Breadcrumb schema",
        "Crawlable FAQ and answer block",
        "Image alt text and mobile layout"
      ],
      avoidTasks: []
    };
  }

  if (marketplacePlatforms.includes(platform)) {
    const label =
      platform === "shopee" ? "Shopee MY" : platform === "lazada" ? "Lazada MY" : "TikTok Shop MY";

    return {
      category: "marketplace",
      label,
      primaryGoal: "Improve marketplace listing fields buyers actually see and platform search can use.",
      sellerCanEditCode: false,
      focusAreas: [
        "Marketplace product title keywords",
        "First-screen selling points",
        "Product attributes and specifications",
        "Local buyer FAQ for Malaysia",
        "Delivery, COD, warranty, return, and after-sales answers"
      ],
      avoidTasks: [
        "Do not ask the seller to add JSON-LD schema inside the marketplace.",
        "Do not ask Codex to edit website source code for marketplace-only listings."
      ]
    };
  }

  if (platform === "amazon") {
    return {
      category: "amazon",
      label: "Amazon",
      primaryGoal: "Improve Amazon listing copy, bullets, Q&A, comparison, and backend keyword readiness.",
      sellerCanEditCode: false,
      focusAreas: [
        "Amazon title keyword order",
        "Bullet points and feature-benefit copy",
        "A+ content outline",
        "Buyer Q&A and comparison coverage",
        "Backend keyword and after-sales clarity"
      ],
      avoidTasks: [
        "Do not ask the seller to add JSON-LD schema to Amazon.",
        "Do not ask Codex to change Amazon source code."
      ]
    };
  }

  return {
    category: "unknown",
    label: "Unknown platform",
    primaryGoal: "Identify whether this is an owned store or marketplace before choosing fixes.",
    sellerCanEditCode: false,
    focusAreas: [
      "Confirm the selling platform",
      "Clarify which fields the seller can edit",
      "Improve title, product copy, FAQ, and buyer answers first"
    ],
    avoidTasks: ["Do not assume schema or code edits are possible until the platform is known."]
  };
}

export function isMarketplacePlatform(platform: Platform): boolean {
  return getPlatformProfile(platform).category === "marketplace" || getPlatformProfile(platform).category === "amazon";
}
