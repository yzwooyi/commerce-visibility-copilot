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
  return Array.from(new Set(nodes.map((node) => cleanText(node.textContent || "")).filter(Boolean)));
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function metaContent(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const value = doc.querySelector(selector)?.getAttribute("content");
    if (value?.trim()) return cleanText(value);
  }
  return "";
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

function readJsonLdRecords(doc: Document): Record<string, unknown>[] {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const records: Record<string, unknown>[] = [];

  function collect(item: unknown) {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    records.push(record);
    const graph = record["@graph"];
    if (Array.isArray(graph)) graph.forEach(collect);
  }

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "{}") as unknown;
      if (Array.isArray(parsed)) parsed.forEach(collect);
      else collect(parsed);
    } catch {
      continue;
    }
  }

  return records;
}

function schemaValue(records: Record<string, unknown>[], keys: string[]): string {
  for (const record of records) {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return cleanText(value);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const nestedKey of keys) {
          const nested = (value as Record<string, unknown>)[nestedKey];
          if (typeof nested === "string" && nested.trim()) return cleanText(nested);
        }
      }
      if (Array.isArray(value)) {
        const firstText = value.find((item) => typeof item === "string" && item.trim());
        if (typeof firstText === "string") return cleanText(firstText);
      }
    }
  }
  return "";
}

function firstVisibleText(doc: Document, selectors: string[]): { text: string; source: string } {
  for (const selector of selectors) {
    const node = doc.querySelector(selector);
    const text = cleanText(node?.textContent || "");
    if (text && text.length >= 20) return { text, source: selector };
  }
  return { text: "", source: "" };
}

function bestTextBlock(doc: Document, selectors: string[]): { text: string; source: string; sources: string[] } {
  const candidates: { text: string; source: string }[] = [];

  for (const selector of selectors) {
    const nodes = Array.from(doc.querySelectorAll(selector));
    for (const node of nodes) {
      const text = cleanText(node.textContent || "");
      if (text.length >= 80) candidates.push({ text, source: selector });
    }
  }

  const uniqueCandidates = candidates.filter(
    (candidate, index, list) => list.findIndex((item) => item.text === candidate.text) === index
  );
  const best = uniqueCandidates.sort((a, b) => b.text.length - a.text.length)[0];

  return {
    text: best?.text || "",
    source: best?.source || "",
    sources: Array.from(new Set(uniqueCandidates.map((candidate) => candidate.source))).slice(0, 12)
  };
}

function extractFaqQuestions(doc: Document, bodyText: string): string[] {
  const selectorQuestions = collectText(
    Array.from(
      doc.querySelectorAll(
        "details summary, [itemprop='name'], .faq h3, .faq-question, [class*='faq'] h2, [class*='faq'] h3, [class*='question'], [class*='Question']"
      )
    )
  );
  const questionPattern = /(?:^|[.!?\n])\s*([^.!?\n]{8,120}\?)/g;
  const textQuestions = Array.from(bodyText.matchAll(questionPattern))
    .map((match) => cleanText(match[1] || ""))
    .filter((question) => question.length >= 8);

  return Array.from(new Set([...selectorQuestions, ...textQuestions])).slice(0, 20);
}

function compactDescription(text: string, maxLength = 6000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
}

export function scanDocument(doc: Document = document): ProductPageSnapshot {
  const url = doc.location.href;
  const records = readJsonLdRecords(doc);
  const bodyText = cleanText(doc.body?.innerText || doc.body?.textContent || "");
  const metaDescription = metaContent(doc, [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]'
  ]);
  const ogTitle = metaContent(doc, ['meta[property="og:title"]', 'meta[name="twitter:title"]']);
  const schemaName = schemaValue(records, ["name", "headline"]);
  const schemaDescription = schemaValue(records, ["description"]);
  const h1 = collectText(Array.from(doc.querySelectorAll("h1")));
  const h2 = collectText(Array.from(doc.querySelectorAll("h2")));
  const imageAltTexts = Array.from(doc.querySelectorAll("img")).map((img) => img.getAttribute("alt") || "");
  const faqQuestions = extractFaqQuestions(doc, bodyText);
  const productText = bestTextBlock(doc, [
    "[itemprop='description']",
    "[data-testid*='description']",
    "[data-testid*='product']",
    "[class*='product-description']",
    "[class*='ProductDescription']",
    "[class*='description']",
    "[class*='Description']",
    "[class*='product-detail']",
    "[class*='ProductDetail']",
    "[class*='item-detail']",
    "[class*='ItemDetail']",
    "[class*='pdp']",
    "[class*='PDP']",
    "section",
    "main",
    "article"
  ]);
  const descriptionText = compactDescription(schemaDescription || productText.text || metaDescription || bodyText.slice(0, 6000));

  const priceResult = firstVisibleText(doc, [
    "[itemprop='price']",
    "[class*='price']",
    "[class*='Price']",
    "[data-price]",
    "[aria-label*='price']"
  ]);
  const price = priceResult.text.match(/(?:RM|S\\$|[$€£])?\s?\d[\d,.]*/)?.[0] || undefined;
  const ratingResult = firstVisibleText(doc, [
    "[itemprop='ratingValue']",
    "[class*='rating']",
    "[class*='Rating']",
    "[aria-label*='rating']",
    "[aria-label*='star']"
  ]);
  const rating = ratingResult.text || schemaValue(records, ["ratingValue", "reviewRating"]);
  const title = h1[0] || schemaName || ogTitle || doc.title || "";
  const foundFields = [
    title ? "title" : "",
    metaDescription ? "meta description" : "",
    descriptionText ? "description/body text" : "",
    faqQuestions.length ? "FAQ/questions" : "",
    price ? "price" : "",
    rating ? "rating/review signal" : "",
    imageAltTexts.length ? "images" : "",
    readSchemaTypes(doc).length ? "schema" : ""
  ].filter(Boolean);
  const missingFields = [
    title ? "" : "title",
    descriptionText.length >= 300 ? "" : "long product description",
    faqQuestions.length >= 3 ? "" : "buyer FAQ/questions",
    price ? "" : "visible price",
    rating ? "" : "rating/review signal",
    imageAltTexts.some((alt) => alt.trim().length >= 10) ? "" : "descriptive image alt text"
  ].filter(Boolean);

  return {
    url,
    platform: detectPlatform(url, doc),
    title,
    metaTitle: doc.title || "",
    metaDescription,
    h1,
    h2,
    descriptionText,
    imageAltTexts,
    faqQuestions,
    schemaTypes: readSchemaTypes(doc),
    visiblePrice: price,
    visibleRating: rating || undefined,
    bodyTextLength: bodyText.length,
    scanEvidence: {
      scannedAt: new Date().toISOString(),
      titleSource: h1[0] ? "h1" : schemaName ? "json-ld name" : ogTitle ? "open graph title" : "document title",
      descriptionSource: schemaDescription ? "json-ld description" : productText.source || (metaDescription ? "meta/open graph description" : "body text"),
      priceSource: price ? priceResult.source || "page text" : undefined,
      ratingSource: rating ? ratingResult.source || "json-ld rating" : undefined,
      imageCount: imageAltTexts.length,
      descriptionLength: descriptionText.length,
      bodyTextLength: bodyText.length,
      foundFields,
      missingFields,
      textSources: productText.sources
    }
  };
}
