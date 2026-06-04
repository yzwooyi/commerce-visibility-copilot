import type { Platform, ProductPageSnapshot } from "./types";

function detectPlatform(url: string, doc: Document): Platform {
  const lower = url.toLowerCase();
  const generator = doc.querySelector('meta[name="generator"]')?.getAttribute("content")?.toLowerCase() || "";

  if (lower.includes("myshopify.com") || generator.includes("shopify")) return "shopify";
  if (generator.includes("woocommerce") || doc.body.className.toLowerCase().includes("woocommerce")) return "woocommerce";
  if (lower.includes("shopee.")) return "shopee";
  if (lower.includes("lazada.")) return "lazada";
  if (lower.includes("tiktok.com")) return "tiktok_shop";
  if (lower.includes("amazon.")) return "amazon";
  if (lower.startsWith("http")) return "independent";
  return "unknown";
}

function collectText(nodes: Element[]): string[] {
  return nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "").filter(Boolean);
}

function readSchemaTypes(doc: Document): string[] {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const types = new Set<string>();

  function readItem(item: unknown) {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const type = record["@type"];
    if (Array.isArray(type)) type.forEach((entry) => types.add(String(entry)));
    else if (type) types.add(String(type));

    const graph = record["@graph"];
    if (Array.isArray(graph)) graph.forEach(readItem);
  }

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "{}") as unknown;
      if (Array.isArray(parsed)) parsed.forEach(readItem);
      else readItem(parsed);
    } catch {
      continue;
    }
  }

  return Array.from(types);
}

function firstVisibleText(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const node = doc.querySelector(selector);
    const text = node?.textContent?.replace(/\s+/g, " ").trim();
    if (text && text.length >= 20) return text;
  }
  return "";
}

export function scanDocument(doc: Document = document): ProductPageSnapshot {
  const url = doc.location.href;
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const h1 = collectText(Array.from(doc.querySelectorAll("h1")));
  const h2 = collectText(Array.from(doc.querySelectorAll("h2")));
  const imageAltTexts = Array.from(doc.querySelectorAll("img")).map((img) => img.getAttribute("alt") || "");
  const faqQuestions = collectText(
    Array.from(doc.querySelectorAll("details summary, [itemprop='name'], .faq h3, .faq-question, [class*='faq'] h3"))
  ).slice(0, 20);

  const descriptionText =
    firstVisibleText(doc, [
      "[itemprop='description']",
      "[class*='product-description']",
      "[class*='ProductDescription']",
      "[class*='description']",
      "main",
      "article"
    ]) || doc.body.textContent?.replace(/\s+/g, " ").trim().slice(0, 2400) || "";

  const price =
    firstVisibleText(doc, ["[itemprop='price']", "[class*='price']", "[data-price]"]).match(/[$€£RM]?\s?\d[\d,.]*/)?.[0] ||
    undefined;
  const rating = firstVisibleText(doc, ["[itemprop='ratingValue']", "[class*='rating']", "[aria-label*='rating']"]);

  return {
    url,
    platform: detectPlatform(url, doc),
    title: h1[0] || doc.title || "",
    metaTitle: doc.title || "",
    metaDescription,
    h1,
    h2,
    descriptionText,
    imageAltTexts,
    faqQuestions,
    schemaTypes: readSchemaTypes(doc),
    visiblePrice: price,
    visibleRating: rating || undefined
  };
}
