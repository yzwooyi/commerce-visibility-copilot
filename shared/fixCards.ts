import { getPlatformProfile } from "./platformOptimization";
import type { ChecklistItem, ProductPageSnapshot } from "./types";

export interface BeginnerFixCard {
  id: string;
  title: string;
  plainIssue: string;
  whyItMatters: string;
  sellerAction: string;
  pasteLocation: string;
  claudeTask: string;
  checkRules: string[];
  completed: boolean;
}

function productContext(snapshot: ProductPageSnapshot): string {
  return [
    `Platform: ${getPlatformProfile(snapshot.platform).label}`,
    `URL: ${snapshot.url || "Not provided"}`,
    `Current title: ${snapshot.title || "Not provided"}`,
    `Current description: ${snapshot.descriptionText.slice(0, 900) || "Not provided"}`,
    `Existing FAQ: ${snapshot.faqQuestions.join(" | ") || "None"}`
  ].join("\n");
}

function claudeTask(snapshot: ProductPageSnapshot, task: string, requiredOutput: string): string {
  return `You are helping a Malaysia ecommerce seller improve a product listing for SEO, GEO, and AEO.

${productContext(snapshot)}

Task:
${task}

Required output:
${requiredOutput}

Rules:
- Write for Malaysia buyers.
- Keep claims believable and marketplace-safe.
- Use clear English by default, with optional BM/Chinese buyer phrases when useful.
- Do not invent certifications, warranty, shipping, COD, or authenticity proof. If missing, write a safe placeholder the seller can confirm.`;
}

const marketplaceFixes: Record<string, Omit<BeginnerFixCard, "completed" | "claudeTask"> & {
  task: string;
  requiredOutput: string;
}> = {
  "marketplace-title": {
    id: "marketplace-title",
    title: "Fix title",
    plainIssue: "The title is too weak for Shopee MY search and local buyer scanning.",
    whyItMatters: "Marketplace search needs product type, key benefit, target buyer, and useful specs in the title.",
    sellerAction: "Generate 3 title options, choose the clearest one, then paste it into the product title field.",
    pasteLocation: "Shopee Seller Centre > Product Name",
    task: "Rewrite the product title for Shopee MY search. Include product type, main benefit, target use case, and important specs without sounding spammy.",
    requiredOutput: "Give 5 title options under 120 characters. Mark the best option and explain why.",
    checkRules: ["Has product type", "Has main benefit", "Has target use case or buyer", "Has useful spec", "No fake claims"]
  },
  "marketplace-description": {
    id: "marketplace-description",
    title: "Fix description",
    plainIssue: "The listing description does not give enough benefits, specs, and buying confidence.",
    whyItMatters: "Claude, Google snippets, marketplace search, and buyers all need a clear product story, not just a short sentence.",
    sellerAction: "Generate a full listing description, review the facts, then paste it into the description field.",
    pasteLocation: "Shopee Seller Centre > Product Description",
    task: "Expand the product listing description with a strong opening, benefits, specifications, what is included, usage steps, and buyer notes.",
    requiredOutput: "Return a ready-to-paste Shopee description with sections: Why buyers choose it, Benefits, Specs, How to use, Package includes, Notes.",
    checkRules: ["Benefits are specific", "Specs are included", "Usage is clear", "Package contents are listed", "No unsupported promises"]
  },
  "marketplace-faq": {
    id: "marketplace-faq",
    title: "Add buyer FAQ",
    plainIssue: "Local buyer questions are missing from the listing copy.",
    whyItMatters: "AEO depends on direct answers. Buyers also hesitate when COD, delivery, suitability, or usage questions are not answered.",
    sellerAction: "Generate FAQ answers, remove anything untrue, then add them near the bottom of the listing description.",
    pasteLocation: "Shopee Product Description > FAQ section",
    task: "Create a local Malaysia buyer FAQ for this product. Cover practical questions buyers ask before checkout.",
    requiredOutput: "Return 8 FAQ items with short answers. Include delivery/COD, suitability, usage, safety, warranty/return, authenticity, and comparison where relevant.",
    checkRules: ["At least 5 FAQ items", "Answers local Malaysia concerns", "Short direct answers", "No invented policies", "Easy to paste"]
  },
  "marketplace-suitability": {
    id: "marketplace-suitability",
    title: "Answer suitability and usage",
    plainIssue: "The listing does not clearly say who the product is suitable for, how safe it is, or how to use it.",
    whyItMatters: "AI assistants and cautious buyers need explicit suitability, safety, and usage answers before recommending the product.",
    sellerAction: "Generate a suitability and usage block, confirm the details, then paste it into the description.",
    pasteLocation: "Shopee Product Description > Usage / Suitable for section",
    task: "Write a suitability, safety, and usage section for this product. Make it practical for Malaysia shoppers.",
    requiredOutput: "Return sections for Suitable for, Not ideal for, How to use, Safety notes, and When to contact seller.",
    checkRules: ["Says who it fits", "Says who should avoid or confirm first", "Explains usage steps", "Includes safety notes", "Avoids medical-style guarantees"]
  },
  "marketplace-delivery": {
    id: "marketplace-delivery",
    title: "Add delivery and after-sales answers",
    plainIssue: "The listing does not answer delivery, COD, return, or warranty questions.",
    whyItMatters: "Malaysia buyers often decide based on shipping area, COD availability, return clarity, warranty, and after-sales support.",
    sellerAction: "Generate a policy answer block, replace placeholders with your real policy, then paste it into the listing.",
    pasteLocation: "Shopee Product Description > Delivery / Warranty section",
    task: "Write a delivery, COD, return, warranty, and after-sales answer block for a Shopee MY listing.",
    requiredOutput: "Return a safe block with placeholders for any policy the seller must confirm, including Sabah/Sarawak if relevant.",
    checkRules: ["Mentions delivery or shipping", "Mentions COD if available or placeholder", "Mentions return/refund", "Mentions warranty if relevant", "No fake policy"]
  },
  "marketplace-proof": {
    id: "marketplace-proof",
    title: "Add trust proof",
    plainIssue: "The listing does not show enough proof such as reviews, rating context, original/authentic claim, or seller assurance.",
    whyItMatters: "AI recommendations and buyers need trust signals before choosing one listing over another.",
    sellerAction: "Generate a trust block using only proof you actually have, then paste it under benefits or FAQ.",
    pasteLocation: "Shopee Product Description > Why buy from us / Trust proof",
    task: "Write a trust proof section for this listing using only verified seller evidence.",
    requiredOutput: "Return 3 short trust proof versions: review/rating version, authenticity version, and safe fallback if proof is missing.",
    checkRules: ["Uses real proof", "Does not invent review count", "Explains authenticity if true", "Sounds credible", "Short enough for listing"]
  },
  "marketplace-comparison": {
    id: "marketplace-comparison",
    title: "Add comparison",
    plainIssue: "The listing does not explain how this product differs from common alternatives.",
    whyItMatters: "GEO improves when AI can clearly say why this product is better for a specific buyer situation.",
    sellerAction: "Generate a comparison block, check it is fair, then paste it near the benefits section.",
    pasteLocation: "Shopee Product Description > Comparison / Why this one",
    task: "Create a fair comparison against common alternatives without attacking competitors.",
    requiredOutput: "Return a simple comparison table with columns: Buyer need, This product, Common alternative, Best for.",
    checkRules: ["Compares by buyer need", "Does not name competitors unless provided", "Fair language", "Shows differentiation", "Easy to scan"]
  },
  "marketplace-after-sales": {
    id: "marketplace-after-sales",
    title: "Final platform check",
    plainIssue: "Important platform fields may still be incomplete before publishing.",
    whyItMatters: "Even strong copy can fail if price, variants, attributes, shipping, or image fields are not checked.",
    sellerAction: "Use this as the final publish checklist inside Seller Centre before clicking update.",
    pasteLocation: "Shopee Seller Centre > Product edit page",
    task: "Create a final Shopee MY publish checklist for this listing before the seller clicks update.",
    requiredOutput: "Return a concise checklist covering title, description, images, variations, price, stock, category, attributes, delivery, return, warranty, and FAQ.",
    checkRules: ["Checks title", "Checks description", "Checks variants", "Checks price and stock", "Checks shipping/return"]
  }
};

const ownedStoreFixes: Record<string, Omit<BeginnerFixCard, "completed" | "claudeTask"> & {
  task: string;
  requiredOutput: string;
}> = {
  title: {
    id: "title",
    title: "Fix product title",
    plainIssue: "The product title is too short or unclear.",
    whyItMatters: "Search engines and AI tools need a specific product name, category, buyer use case, and key benefit.",
    sellerAction: "Generate stronger title options, choose one, then update the product page title/H1.",
    pasteLocation: "Product page title / H1",
    task: "Rewrite the product title for an ecommerce product page.",
    requiredOutput: "Give 5 SEO-friendly title options and one recommended H1.",
    checkRules: ["Specific product type", "Buyer use case", "Main benefit", "Readable", "Not keyword stuffed"]
  },
  meta: {
    id: "meta",
    title: "Add meta description",
    plainIssue: "The page is missing a useful search result description.",
    whyItMatters: "A good meta description helps Google snippets and gives AI a concise page summary.",
    sellerAction: "Generate a meta description and add it in the page SEO settings.",
    pasteLocation: "SEO settings > Meta description",
    task: "Write an SEO meta description for this product page.",
    requiredOutput: "Return 3 options under 155 characters with clear benefit and buyer intent.",
    checkRules: ["Under 155 characters", "Mentions product", "Mentions benefit", "Natural language", "No fake claim"]
  },
  description: {
    id: "description",
    title: "Expand page copy",
    plainIssue: "The product page copy is too thin.",
    whyItMatters: "Thin copy makes it harder for search engines, AI, and buyers to understand when to choose the product.",
    sellerAction: "Generate a full page section outline and paste the content into the product page.",
    pasteLocation: "Product description / page sections",
    task: "Expand the product page copy with benefits, specs, usage, and buyer proof.",
    requiredOutput: "Return ready-to-paste page copy with sections for overview, benefits, specs, usage, FAQ, and proof.",
    checkRules: ["Enough detail", "Benefits and specs", "Usage included", "FAQ included", "Clear buyer fit"]
  },
  faq: {
    id: "faq",
    title: "Add FAQ",
    plainIssue: "Buyer questions are missing.",
    whyItMatters: "FAQ improves AEO because AI can quote direct answers from the page.",
    sellerAction: "Generate FAQ, then add it as a visible page section.",
    pasteLocation: "Product page FAQ section",
    task: "Create buyer FAQ for this ecommerce product page.",
    requiredOutput: "Return 8 FAQ questions and short answers.",
    checkRules: ["At least 5 questions", "Direct answers", "Buyer concerns", "Visible on page", "No invented policies"]
  },
  "product-schema": {
    id: "product-schema",
    title: "Add Product schema",
    plainIssue: "The page is missing Product structured data.",
    whyItMatters: "Schema helps search engines and AI understand price, product identity, offers, reviews, and availability.",
    sellerAction: "Copy the Codex prompt and ask Codex to implement Product schema on the site.",
    pasteLocation: "Website code / SEO app schema settings",
    task: "Prepare Product schema implementation requirements for Codex.",
    requiredOutput: "Return Product JSON-LD fields needed and a short Codex implementation brief.",
    checkRules: ["Product type", "Offer fields", "Brand/name", "Availability", "No invalid fake review data"]
  },
  "faq-schema": {
    id: "faq-schema",
    title: "Add FAQ schema",
    plainIssue: "The page has no FAQ structured data.",
    whyItMatters: "FAQ schema helps machines understand the questions and answers on the page.",
    sellerAction: "Use Codex to add FAQ schema matching the visible FAQ.",
    pasteLocation: "Website code / SEO app schema settings",
    task: "Prepare FAQ schema implementation requirements for Codex.",
    requiredOutput: "Return FAQPage JSON-LD from the visible FAQ and a Codex implementation brief.",
    checkRules: ["Matches visible FAQ", "Valid FAQPage schema", "No hidden-only answers", "Readable answers", "Implementation note"]
  },
  "alt-text": {
    id: "alt-text",
    title: "Add image alt text",
    plainIssue: "Product images do not describe what they show.",
    whyItMatters: "Alt text helps image SEO, accessibility, and AI understanding of product visuals.",
    sellerAction: "Generate alt text and update product images.",
    pasteLocation: "Product media / image alt text fields",
    task: "Write descriptive product image alt text.",
    requiredOutput: "Return 8 alt text examples for product, detail, use case, packaging, and comparison images.",
    checkRules: ["Describes image", "Mentions product", "Not keyword spam", "Useful for accessibility", "Specific"]
  },
  "answer-block": {
    id: "answer-block",
    title: "Add AI answer block",
    plainIssue: "The page lacks a concise answer block AI assistants can quote.",
    whyItMatters: "GEO improves when the product has a clear paragraph explaining what it is, who it is for, and why to choose it.",
    sellerAction: "Generate an answer block and place it near the top of the page.",
    pasteLocation: "Product page intro / answer block section",
    task: "Write an AI-readable answer block for this product.",
    requiredOutput: "Return a 90-130 word answer block covering what it is, who it is for, key benefits, and when to choose it.",
    checkRules: ["What it is", "Who it is for", "Why choose it", "Specific benefits", "Quote-ready"]
  }
};

export function buildBeginnerFixCards(snapshot: ProductPageSnapshot, checklist: ChecklistItem[]): BeginnerFixCard[] {
  const profile = getPlatformProfile(snapshot.platform);
  const templates = profile.category === "owned_store" ? ownedStoreFixes : marketplaceFixes;

  return checklist.map((item) => {
    const template = templates[item.id] || {
      id: item.id,
      title: item.label,
      plainIssue: "This item is not ready yet.",
      whyItMatters: "Completing it makes the listing easier for buyers, search engines, and AI assistants to understand.",
      sellerAction: "Use Claude to rewrite the missing content, then paste it into the matching platform field.",
      pasteLocation: "Product edit page",
      task: `Improve this item: ${item.label}`,
      requiredOutput: "Return ready-to-paste ecommerce listing copy and a short checklist.",
      checkRules: ["Specific", "Buyer-friendly", "Accurate", "Ready to paste", "No fake claims"]
    };

    return {
      id: template.id,
      title: template.title,
      plainIssue: template.plainIssue,
      whyItMatters: template.whyItMatters,
      sellerAction: template.sellerAction,
      pasteLocation: template.pasteLocation,
      claudeTask: claudeTask(snapshot, template.task, template.requiredOutput),
      checkRules: template.checkRules,
      completed: item.completed
    };
  });
}
