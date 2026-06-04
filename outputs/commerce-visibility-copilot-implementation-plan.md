# Commerce Visibility Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP Chrome extension and lightweight Web App that scans ecommerce product pages, scores SEO/GEO/AEO readiness, generates Claude/Codex fix prompts, checks pasted outputs, and gives a publish checklist.

**Architecture:** Use a Chrome Manifest V3 extension as the product entry point and a React/Vite Web App for full reports. Keep scoring, prompt generation, and checklist logic in shared TypeScript modules so the extension and Web App produce consistent results.

**Tech Stack:** React, TypeScript, Vite, Chrome Manifest V3, CSS modules or plain CSS tokens, local storage for MVP persistence, optional Node/Express or serverless API only when AI calls are added.

---

## Route Classification

Route: Build.

Reason:

- This is bounded product implementation.
- No production data, payments, customer records, or store account mutation in MVP.
- No subagents required for the first local prototype unless the user requests parallel execution.

## File Structure

Recommended structure:

```text
commerce-visibility-copilot/
  package.json
  vite.config.ts
  tsconfig.json
  index.html
  extension/
    manifest.json
    sidepanel.html
    src/
      sidepanel.tsx
      contentScript.ts
      background.ts
  web/
    src/
      main.tsx
      App.tsx
      styles.css
  shared/
    pageScanner.ts
    seoScoring.ts
    geoScoring.ts
    aeoScoring.ts
    promptTemplates.ts
    outputChecker.ts
    checklist.ts
    types.ts
  tests/
    scoring.test.ts
    promptTemplates.test.ts
    outputChecker.test.ts
```

Responsibilities:

- `shared/types.ts`: shared product page and report types.
- `shared/pageScanner.ts`: parse product page data from DOM-readable fields.
- `shared/seoScoring.ts`: score SEO readiness.
- `shared/geoScoring.ts`: score AI answer visibility.
- `shared/aeoScoring.ts`: score buyer-question readiness.
- `shared/promptTemplates.ts`: generate Claude and Codex prompts.
- `shared/outputChecker.ts`: check pasted Claude/Codex output.
- `shared/checklist.ts`: generate publish checklist.
- `extension/src/contentScript.ts`: extract current page data after user action.
- `extension/src/sidepanel.tsx`: extension UI.
- `web/src/App.tsx`: report workspace UI.

## Task 1: Scaffold Project

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step 1: Create package config**

```json
{
  "name": "commerce-visibility-copilot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/chrome": "^0.0.260"
  }
}
```

- [ ] **Step 2: Create TypeScript config**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["web/src", "extension/src", "shared", "tests"],
  "references": []
}
```

- [ ] **Step 3: Create Vite config**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
```

- [ ] **Step 4: Create root HTML**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Commerce Visibility Copilot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/web/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install and verify scaffold**

Run:

```bash
npm install
npm run build
```

Expected:

```text
vite build completes without TypeScript errors
```

## Task 2: Define Shared Types

**Files:**

- Create: `shared/types.ts`

- [ ] **Step 1: Create types**

```ts
export type Platform =
  | "shopify"
  | "woocommerce"
  | "shopee"
  | "lazada"
  | "tiktok_shop"
  | "amazon"
  | "independent"
  | "unknown";

export type ScoreBand = "weak" | "needs_work" | "good" | "strong";

export interface ProductPageSnapshot {
  url: string;
  platform: Platform;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string[];
  h2: string[];
  descriptionText: string;
  imageAltTexts: string[];
  faqQuestions: string[];
  schemaTypes: string[];
  visiblePrice?: string;
  visibleRating?: string;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  reasons: string[];
  topFixes: string[];
}

export interface VisibilityReport {
  snapshot: ProductPageSnapshot;
  seo: ScoreResult;
  geo: ScoreResult;
  aeo: ScoreResult;
  topFixes: string[];
  publishChecklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface FixPrompts {
  claudePrompt: string;
  codexPrompt: string;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:

```bash
npm run build
```

Expected:

```text
No TypeScript errors from shared/types.ts
```

## Task 3: Build Scoring Modules

**Files:**

- Create: `shared/seoScoring.ts`
- Create: `shared/geoScoring.ts`
- Create: `shared/aeoScoring.ts`
- Create: `tests/scoring.test.ts`

- [ ] **Step 1: Write scoring tests**

```ts
import { describe, expect, it } from "vitest";
import { scoreSeo } from "../shared/seoScoring";
import { scoreGeo } from "../shared/geoScoring";
import { scoreAeo } from "../shared/aeoScoring";
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
  metaDescription: "Shop a hydrating glow serum for dry and sensitive skin with clear usage guidance and buyer FAQs.",
  h1: ["Hydrating Glow Serum for Dry Sensitive Skin"],
  h2: ["Who it is for", "How to use", "FAQ"],
  descriptionText:
    "This hydrating serum is designed for dry and sensitive skin. It helps improve glow, supports daily routines, and works in humid weather. It is best for buyers who want a gentle product with clear usage instructions.",
  imageAltTexts: ["Hydrating glow serum bottle for dry sensitive skin"],
  faqQuestions: ["Is this suitable for sensitive skin?", "How often should I use it?"],
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
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm test
```

Expected:

```text
Tests fail because scoreSeo, scoreGeo, and scoreAeo do not exist yet
```

- [ ] **Step 3: Implement SEO scoring**

```ts
import type { ProductPageSnapshot, ScoreBand, ScoreResult } from "./types";

function band(score: number): ScoreBand {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 45) return "needs_work";
  return "weak";
}

export function scoreSeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];

  if (snapshot.title.length >= 25) score += 10;
  else {
    reasons.push("The product title is too short to explain the product clearly.");
    topFixes.push("Improve the product title.");
  }

  if (snapshot.metaDescription.length >= 80) score += 15;
  else {
    reasons.push("The page is missing a useful meta description.");
    topFixes.push("Add a meta description.");
  }

  if (snapshot.h1.length === 1 && snapshot.h1[0].length >= 20) score += 10;
  else {
    reasons.push("The H1 does not clearly describe the product.");
    topFixes.push("Improve the H1.");
  }

  if (snapshot.h2.length >= 2) score += 10;
  else {
    reasons.push("The page needs clearer sections for buyers and crawlers.");
    topFixes.push("Add useful H2 sections.");
  }

  if (snapshot.descriptionText.length >= 250) score += 15;
  else {
    reasons.push("The product description is too thin.");
    topFixes.push("Expand the product description.");
  }

  if (snapshot.imageAltTexts.some((alt) => alt.trim().length >= 15)) score += 10;
  else {
    reasons.push("Product images are missing useful alt text.");
    topFixes.push("Add descriptive image alt text.");
  }

  if (snapshot.schemaTypes.includes("Product") && snapshot.schemaTypes.includes("FAQPage")) score += 20;
  else {
    reasons.push("The page is missing Product or FAQ structured data.");
    topFixes.push("Add Product and FAQ schema.");
  }

  return {
    score: Math.min(score, 100),
    band: band(Math.min(score, 100)),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
```

- [ ] **Step 4: Implement GEO scoring**

```ts
import type { ProductPageSnapshot, ScoreBand, ScoreResult } from "./types";

function band(score: number): ScoreBand {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 45) return "needs_work";
  return "weak";
}

export function scoreGeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const text = `${snapshot.title} ${snapshot.descriptionText} ${snapshot.h2.join(" ")}`.toLowerCase();

  if (text.includes("for ") || text.includes("best for")) score += 15;
  else {
    reasons.push("AI may not know who this product is best for.");
    topFixes.push("Add a clear target customer statement.");
  }

  if (text.includes("solve") || text.includes("helps") || text.includes("designed")) score += 15;
  else {
    reasons.push("The page does not clearly explain the problem this product solves.");
    topFixes.push("Explain the customer problem.");
  }

  if (snapshot.faqQuestions.length >= 2) score += 20;
  else {
    reasons.push("AI answer engines need more structured questions and answers.");
    topFixes.push("Add buyer FAQ.");
  }

  if (text.includes("different") || text.includes("compare") || text.includes("alternative")) score += 15;
  else {
    reasons.push("The page does not explain how the product differs from alternatives.");
    topFixes.push("Add a comparison answer.");
  }

  if (snapshot.schemaTypes.includes("Product")) score += 10;
  else {
    reasons.push("The product entity is not exposed through Product schema.");
    topFixes.push("Add Product schema.");
  }

  if (snapshot.descriptionText.length >= 350) score += 10;
  else {
    reasons.push("The page needs a more complete explanation for AI summarization.");
    topFixes.push("Add an AI answer block.");
  }

  return {
    score: Math.min(score, 100),
    band: band(Math.min(score, 100)),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
```

- [ ] **Step 5: Implement AEO scoring**

```ts
import type { ProductPageSnapshot, ScoreBand, ScoreResult } from "./types";

function band(score: number): ScoreBand {
  if (score >= 85) return "strong";
  if (score >= 70) return "good";
  if (score >= 45) return "needs_work";
  return "weak";
}

export function scoreAeo(snapshot: ProductPageSnapshot): ScoreResult {
  let score = 20;
  const reasons: string[] = [];
  const topFixes: string[] = [];
  const text = `${snapshot.descriptionText} ${snapshot.faqQuestions.join(" ")}`.toLowerCase();

  if (snapshot.faqQuestions.length >= 5) score += 25;
  else {
    reasons.push("The page does not answer enough buyer questions.");
    topFixes.push("Add at least 5 buyer FAQ questions.");
  }

  if (text.includes("how to use") || text.includes("use it") || text.includes("apply")) score += 15;
  else {
    reasons.push("The page does not explain how to use the product.");
    topFixes.push("Add usage guidance.");
  }

  if (text.includes("suitable") || text.includes("safe") || text.includes("for sensitive")) score += 15;
  else {
    reasons.push("The page does not answer suitability or safety concerns.");
    topFixes.push("Add suitability answers.");
  }

  if (text.includes("shipping") || text.includes("return") || text.includes("delivery")) score += 10;
  else {
    reasons.push("Shipping or after-sales questions are not answered.");
    topFixes.push("Add shipping or return FAQ.");
  }

  if (text.includes("compare") || text.includes("different") || text.includes("better than")) score += 10;
  else {
    reasons.push("The page does not help buyers compare alternatives.");
    topFixes.push("Add comparison FAQ.");
  }

  if (snapshot.schemaTypes.includes("FAQPage")) score += 10;
  else {
    reasons.push("FAQ answers are not exposed through FAQ schema.");
    topFixes.push("Add FAQ schema.");
  }

  return {
    score: Math.min(score, 100),
    band: band(Math.min(score, 100)),
    reasons,
    topFixes: topFixes.slice(0, 3)
  };
}
```

- [ ] **Step 6: Run scoring tests**

Run:

```bash
npm test
```

Expected:

```text
All scoring tests pass
```

## Task 4: Build Prompt Templates

**Files:**

- Create: `shared/promptTemplates.ts`
- Create: `tests/promptTemplates.test.ts`

- [ ] **Step 1: Write prompt tests**

```ts
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
});
```

- [ ] **Step 2: Implement prompt generator**

```ts
import type { FixPrompts, ProductPageSnapshot } from "./types";

export function generateFixPrompts(snapshot: ProductPageSnapshot): FixPrompts {
  const productData = [
    `URL: ${snapshot.url}`,
    `Platform: ${snapshot.platform}`,
    `Title: ${snapshot.title}`,
    `Meta title: ${snapshot.metaTitle || "Missing"}`,
    `Meta description: ${snapshot.metaDescription || "Missing"}`,
    `H1: ${snapshot.h1.join(" | ") || "Missing"}`,
    `H2: ${snapshot.h2.join(" | ") || "Missing"}`,
    `Description: ${snapshot.descriptionText || "Missing"}`,
    `FAQ questions: ${snapshot.faqQuestions.join(" | ") || "Missing"}`,
    `Schema types: ${snapshot.schemaTypes.join(" | ") || "Missing"}`
  ].join("\n");

  const claudePrompt = `You are an ecommerce SEO, GEO, and AEO strategist. Rewrite this product page so it is clear for buyers, search engines, and AI answer engines.

Product data:
${productData}

Create:
1. SEO product title.
2. Meta title under 60 characters.
3. Meta description under 155 characters.
4. Improved product description.
5. 8 buyer-focused FAQ questions and answers.
6. A short AI answer block explaining who this product is for, what problem it solves, and why it is different.
7. Suggested image alt text.
8. A comparison paragraph against common alternatives.

Keep the writing natural, specific, and useful. Avoid generic AI-sounding claims.`;

  const codexPrompt = `You are improving an ecommerce product page for SEO, GEO, and AEO.

Product page:
${snapshot.url}

Tasks:
1. Update metadata: title and meta description.
2. Improve the page H1/H2 structure.
3. Add or update image alt text.
4. Add a buyer FAQ section.
5. Add Product schema JSON-LD.
6. Add Offer schema fields when price and availability exist.
7. Add FAQPage schema for the FAQ section.
8. Add Breadcrumb schema when breadcrumbs exist.
9. Ensure all structured data is crawlable in rendered HTML.
10. Verify the mobile layout and make sure no text overlaps or clips.

Current page data:
${productData}

After implementation, report files changed, metadata updated, schema added, FAQ added, tests or checks run, and remaining risks.`;

  return { claudePrompt, codexPrompt };
}
```

- [ ] **Step 3: Run prompt tests**

Run:

```bash
npm test
```

Expected:

```text
Prompt tests pass
```

## Task 5: Build Publish Checklist

**Files:**

- Create: `shared/checklist.ts`

- [ ] **Step 1: Implement checklist generator**

```ts
import type { ChecklistItem, ProductPageSnapshot } from "./types";

export function generatePublishChecklist(snapshot: ProductPageSnapshot): ChecklistItem[] {
  return [
    {
      id: "title",
      label: "Update product title",
      completed: snapshot.title.length >= 25
    },
    {
      id: "meta",
      label: "Add SEO meta description",
      completed: snapshot.metaDescription.length >= 80
    },
    {
      id: "description",
      label: "Expand product description",
      completed: snapshot.descriptionText.length >= 250
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
      completed: snapshot.descriptionText.length >= 350
    }
  ];
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected:

```text
Build succeeds
```

## Task 6: Build Page Scanner

**Files:**

- Create: `shared/pageScanner.ts`

- [ ] **Step 1: Implement DOM scanner**

```ts
import type { Platform, ProductPageSnapshot } from "./types";

function detectPlatform(url: string): Platform {
  const lower = url.toLowerCase();
  if (lower.includes("myshopify.com")) return "shopify";
  if (lower.includes("shopee.")) return "shopee";
  if (lower.includes("lazada.")) return "lazada";
  if (lower.includes("tiktok.com")) return "tiktok_shop";
  if (lower.includes("amazon.")) return "amazon";
  return "unknown";
}

function readSchemaTypes(doc: Document): string[] {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const types = new Set<string>();

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.textContent || "{}");
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const type = item["@type"];
        if (Array.isArray(type)) type.forEach((entry) => types.add(String(entry)));
        else if (type) types.add(String(type));
      }
    } catch {
      continue;
    }
  }

  return Array.from(types);
}

export function scanDocument(doc: Document = document): ProductPageSnapshot {
  const url = doc.location.href;
  const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const h1 = Array.from(doc.querySelectorAll("h1")).map((node) => node.textContent?.trim() || "").filter(Boolean);
  const h2 = Array.from(doc.querySelectorAll("h2")).map((node) => node.textContent?.trim() || "").filter(Boolean);
  const imageAltTexts = Array.from(doc.querySelectorAll("img")).map((img) => img.getAttribute("alt") || "");
  const faqQuestions = Array.from(doc.querySelectorAll("details summary, [itemprop='name'], .faq h3, .faq-question"))
    .map((node) => node.textContent?.trim() || "")
    .filter(Boolean)
    .slice(0, 20);

  const descriptionCandidates = Array.from(doc.querySelectorAll("main, article, [class*='product'], [id*='product']"))
    .map((node) => node.textContent?.replace(/\s+/g, " ").trim() || "")
    .filter((text) => text.length > 80);

  return {
    url,
    platform: detectPlatform(url),
    title: h1[0] || doc.title || "",
    metaTitle: doc.title || "",
    metaDescription,
    h1,
    h2,
    descriptionText: descriptionCandidates[0] || doc.body.textContent?.replace(/\s+/g, " ").trim().slice(0, 2000) || "",
    imageAltTexts,
    faqQuestions,
    schemaTypes: readSchemaTypes(doc)
  };
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected:

```text
Build succeeds
```

## Task 7: Build Extension Side Panel

**Files:**

- Create: `extension/manifest.json`
- Create: `extension/sidepanel.html`
- Create: `extension/src/sidepanel.tsx`
- Create: `extension/src/contentScript.ts`
- Create: `extension/src/background.ts`

- [ ] **Step 1: Create extension manifest**

```json
{
  "manifest_version": 3,
  "name": "Commerce Visibility Copilot",
  "version": "0.1.0",
  "description": "Analyze ecommerce product pages and generate SEO, GEO, and AEO fix tasks for Claude and Codex.",
  "permissions": ["activeTab", "scripting", "sidePanel"],
  "host_permissions": [],
  "background": {
    "service_worker": "src/background.js"
  },
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_title": "Commerce Visibility Copilot"
  }
}
```

- [ ] **Step 2: Create side panel HTML**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Commerce Visibility Copilot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/extension/src/sidepanel.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Implement content script**

```ts
import { scanDocument } from "../../shared/pageScanner";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SCAN_PRODUCT_PAGE") {
    sendResponse(scanDocument(document));
  }
});
```

- [ ] **Step 4: Implement background**

```ts
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});
```

- [ ] **Step 5: Implement side panel UI**

```tsx
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { scoreAeo } from "../../shared/aeoScoring";
import { generatePublishChecklist } from "../../shared/checklist";
import { scoreGeo } from "../../shared/geoScoring";
import { generateFixPrompts } from "../../shared/promptTemplates";
import { scoreSeo } from "../../shared/seoScoring";
import type { ProductPageSnapshot, ScoreResult } from "../../shared/types";
import "../../web/src/styles.css";

function ScoreCard({ label, result }: { label: string; result: ScoreResult }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <strong>{result.score}</strong>
    </div>
  );
}

function App() {
  const [snapshot, setSnapshot] = useState<ProductPageSnapshot | null>(null);

  const report = useMemo(() => {
    if (!snapshot) return null;
    const seo = scoreSeo(snapshot);
    const geo = scoreGeo(snapshot);
    const aeo = scoreAeo(snapshot);
    return {
      seo,
      geo,
      aeo,
      prompts: generateFixPrompts(snapshot),
      checklist: generatePublishChecklist(snapshot),
      topFixes: Array.from(new Set([...seo.topFixes, ...geo.topFixes, ...aeo.topFixes])).slice(0, 3)
    };
  }, [snapshot]);

  async function scanPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) return;
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["src/contentScript.js"]
    });
    const response = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_PRODUCT_PAGE" });
    setSnapshot(response);
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <main className="panel">
      <header className="panel-header">
        <h1>Commerce Visibility Copilot</h1>
        <p>{snapshot ? `Detected: ${snapshot.platform} product page` : "Open a product page and scan it."}</p>
      </header>

      <button className="primary-button" onClick={scanPage}>Analyze this product page</button>

      {report && (
        <>
          <section className="section">
            <ScoreCard label="Can Google find it?" result={report.seo} />
            <ScoreCard label="Can AI recommend it?" result={report.geo} />
            <ScoreCard label="Can buyers get answers?" result={report.aeo} />
          </section>

          <section className="section">
            <h2>Top fixes</h2>
            <ol>
              {report.topFixes.map((fix) => <li key={fix}>{fix}</li>)}
            </ol>
          </section>

          <section className="section actions">
            <button onClick={() => copy(report.prompts.claudePrompt)}>Copy to Claude</button>
            <button onClick={() => copy(report.prompts.codexPrompt)}>Copy to Codex</button>
          </section>

          <section className="section">
            <h2>Publish checklist</h2>
            {report.checklist.map((item) => (
              <label className="check-row" key={item.id}>
                <input type="checkbox" checked={item.completed} readOnly />
                <span>{item.label}</span>
              </label>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 6: Build and load unpacked extension**

Run:

```bash
npm run build
```

Expected:

```text
Build succeeds
```

Manual verification:

- Open Chrome extensions.
- Enable Developer mode.
- Load unpacked `dist` or configured extension output.
- Open an ecommerce product page.
- Click extension.
- Side panel opens.
- Click Analyze.
- Scores and copy buttons appear.

## Task 8: Build Web App Report UI

**Files:**

- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/styles.css`

- [ ] **Step 1: Create main entry**

```tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);
```

- [ ] **Step 2: Create Web App**

```tsx
import { useMemo, useState } from "react";
import { scoreAeo } from "../../shared/aeoScoring";
import { generatePublishChecklist } from "../../shared/checklist";
import { scoreGeo } from "../../shared/geoScoring";
import { generateFixPrompts } from "../../shared/promptTemplates";
import { scoreSeo } from "../../shared/seoScoring";
import type { ProductPageSnapshot } from "../../shared/types";

const emptySnapshot: ProductPageSnapshot = {
  url: "",
  platform: "unknown",
  title: "",
  metaTitle: "",
  metaDescription: "",
  h1: [],
  h2: [],
  descriptionText: "",
  imageAltTexts: [],
  faqQuestions: [],
  schemaTypes: []
};

export default function App() {
  const [snapshot, setSnapshot] = useState<ProductPageSnapshot>(emptySnapshot);

  const report = useMemo(() => {
    const seo = scoreSeo(snapshot);
    const geo = scoreGeo(snapshot);
    const aeo = scoreAeo(snapshot);
    return {
      seo,
      geo,
      aeo,
      prompts: generateFixPrompts(snapshot),
      checklist: generatePublishChecklist(snapshot),
      fixes: Array.from(new Set([...seo.topFixes, ...geo.topFixes, ...aeo.topFixes])).slice(0, 5)
    };
  }, [snapshot]);

  return (
    <main className="app-shell">
      <section className="intake">
        <h1>Commerce Visibility Copilot</h1>
        <p>Turn a product page into Claude and Codex tasks for SEO, GEO, and AEO.</p>
        <input
          value={snapshot.url}
          onChange={(event) => setSnapshot({ ...snapshot, url: event.target.value })}
          placeholder="Product page URL"
        />
        <input
          value={snapshot.title}
          onChange={(event) => setSnapshot({ ...snapshot, title: event.target.value, h1: [event.target.value] })}
          placeholder="Product title"
        />
        <textarea
          value={snapshot.descriptionText}
          onChange={(event) => setSnapshot({ ...snapshot, descriptionText: event.target.value })}
          placeholder="Paste product description"
        />
      </section>

      <section className="report-grid">
        <div className="score-card"><span>Can Google find it?</span><strong>{report.seo.score}</strong></div>
        <div className="score-card"><span>Can AI recommend it?</span><strong>{report.geo.score}</strong></div>
        <div className="score-card"><span>Can buyers get answers?</span><strong>{report.aeo.score}</strong></div>
      </section>

      <section className="workspace-grid">
        <div className="section">
          <h2>Top fixes</h2>
          <ol>{report.fixes.map((fix) => <li key={fix}>{fix}</li>)}</ol>
        </div>
        <div className="section">
          <h2>Claude fix pack</h2>
          <textarea readOnly value={report.prompts.claudePrompt} />
        </div>
        <div className="section">
          <h2>Codex fix pack</h2>
          <textarea readOnly value={report.prompts.codexPrompt} />
        </div>
        <div className="section">
          <h2>Publish checklist</h2>
          {report.checklist.map((item) => (
            <label className="check-row" key={item.id}>
              <input type="checkbox" checked={item.completed} readOnly />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create styles**

```css
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
  background: #f7f8fb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button,
input,
textarea {
  font: inherit;
}

.panel {
  width: 100%;
  min-height: 100vh;
  padding: 18px;
  background: #ffffff;
}

.panel-header h1,
.app-shell h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.panel-header p,
.app-shell p {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
}

.primary-button,
.actions button {
  width: 100%;
  border: 0;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  padding: 11px 12px;
  margin-top: 16px;
  cursor: pointer;
}

.section {
  margin-top: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  background: #ffffff;
}

.section h2 {
  margin: 0 0 10px;
  font-size: 14px;
}

.score-row,
.check-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #eef2f7;
  font-size: 13px;
}

.score-row:last-child,
.check-row:last-child {
  border-bottom: 0;
}

.score-row strong {
  font-size: 18px;
}

.actions {
  display: grid;
  gap: 10px;
}

.actions button {
  margin: 0;
}

.app-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 32px;
}

.intake {
  display: grid;
  gap: 12px;
}

.intake input,
.intake textarea,
.section textarea {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.intake textarea,
.section textarea {
  min-height: 160px;
}

.report-grid,
.workspace-grid {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.report-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.workspace-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.score-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  background: #ffffff;
}

.score-card span {
  display: block;
  color: #64748b;
  font-size: 13px;
}

.score-card strong {
  display: block;
  margin-top: 8px;
  font-size: 34px;
}

@media (max-width: 760px) {
  .app-shell {
    padding: 18px;
  }

  .report-grid,
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run Web App**

Run:

```bash
npm run dev
```

Expected:

```text
Vite local server starts
```

Manual verification:

- Open local URL.
- Enter product title and description.
- Scores update.
- Claude/Codex prompts populate.
- Checklist updates.
- Desktop and mobile widths do not overflow.

## Task 9: Build Output Checker

**Files:**

- Create: `shared/outputChecker.ts`
- Create: `tests/outputChecker.test.ts`

- [ ] **Step 1: Write output checker tests**

```ts
import { describe, expect, it } from "vitest";
import { checkOutput } from "../shared/outputChecker";

describe("output checker", () => {
  it("flags generic output", () => {
    const result = checkOutput("This is a great product. It is amazing and useful.");
    expect(result.status).toBe("needs_improvement");
    expect(result.issues).toContain("Output is too generic.");
  });

  it("approves specific output with FAQ and answer block", () => {
    const result = checkOutput(`
      AI answer block: This serum is best for dry sensitive skin and helps buyers who need a gentle routine.
      FAQ: Is it suitable for sensitive skin? Yes, it is designed for sensitive skin.
      FAQ: How do I use it? Apply it after cleansing.
      Product schema: Product
      FAQ schema: FAQPage
    `);
    expect(result.status).toBe("ready_to_publish");
  });
});
```

- [ ] **Step 2: Implement output checker**

```ts
export interface OutputCheckResult {
  status: "ready_to_publish" | "needs_improvement";
  issues: string[];
}

export function checkOutput(output: string): OutputCheckResult {
  const text = output.toLowerCase();
  const issues: string[] = [];

  if (output.length < 300) issues.push("Output is too short.");
  if (text.includes("great product") || text.includes("amazing and useful")) issues.push("Output is too generic.");
  if (!text.includes("faq")) issues.push("Missing FAQ content.");
  if (!text.includes("answer block")) issues.push("Missing AI answer block.");
  if (!text.includes("schema")) issues.push("Missing schema implementation notes.");
  if (!text.includes("suitable") && !text.includes("best for")) issues.push("Missing target customer or suitability answer.");

  return {
    status: issues.length === 0 ? "ready_to_publish" : "needs_improvement",
    issues
  };
}
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected:

```text
All output checker tests pass
```

## Task 10: Verification and Chrome Store Prep

**Files:**

- Create: `outputs/chrome-store-checklist.md`

- [ ] **Step 1: Create Chrome store checklist**

```md
# Chrome Store Checklist

- [ ] Single-purpose extension description is clear.
- [ ] Manifest V3 is used.
- [ ] Permissions are limited to activeTab, scripting, and sidePanel.
- [ ] Page scan happens only after user clicks Analyze.
- [ ] Privacy policy explains page content scanning.
- [ ] Store listing does not imply official Claude or Codex partnership.
- [ ] Screenshots show side panel, scores, fix pack, and checklist.
- [ ] Extension works on at least one Shopify or independent product page.
- [ ] Extension works on a generic ecommerce product page.
- [ ] No payment, order, customer, or account mutation is performed.
```

- [ ] **Step 2: Run final checks**

Run:

```bash
npm run build
npm test
```

Expected:

```text
Build and tests pass
```

- [ ] **Step 3: Manual QA**

Verify:

- Extension side panel opens.
- Scan works after user click.
- Scores are visible.
- Top fixes are visible.
- Claude prompt copies.
- Codex prompt copies.
- Web App report works.
- Mobile Web App layout does not overflow.
- No console errors during scan and copy flow.

## First Demo Acceptance Criteria

The first demo is acceptable when:

1. A user opens a product page.
2. The extension scans it after user action.
3. The user sees three plain-language scores.
4. The user sees three top fixes.
5. The user can copy a Claude prompt.
6. The user can copy a Codex prompt.
7. The user can paste output into checker.
8. The user gets a publish checklist.
9. No store account connection is required.

## Not Included in First Demo

- Store OAuth.
- Automated write-back.
- Computer Use.
- Payment actions.
- Customer data access.
- Rank tracking.
- Batch SKU optimization.

