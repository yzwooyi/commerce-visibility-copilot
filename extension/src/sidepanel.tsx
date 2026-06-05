import { Bot, Check, Clipboard, ExternalLink, MessageCircle, RefreshCw, ScanLine, Sparkles, Wrench } from "lucide-react";
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildBeginnerFixCards } from "../../shared/fixCards";
import { generateFixOutputPack } from "../../shared/fixOutput";
import { generateFixPrompts } from "../../shared/promptTemplates";
import { buildVisibilityReport } from "../../shared/report";
import { loadSavedReports, saveReportSnapshot } from "../../shared/savedReports";
import { getPlatformProfile } from "../../shared/platformOptimization";
import type { ProductPageSnapshot, SavedReport, ScoreResult } from "../../shared/types";
import "../../web/src/styles.css";

type ScanState = "idle" | "scanning" | "ready" | "error";

type AgentMessage = {
  id: string;
  role: "agent" | "user";
  text: string;
};

function scanProductPageInTab(): ProductPageSnapshot {
  type Platform =
    | "shopify"
    | "woocommerce"
    | "shopee"
    | "lazada"
    | "tiktok_shop"
    | "amazon"
    | "independent"
    | "unknown";

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

  const doc = document;
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
  const visiblePrice = priceResult.text.match(/(?:RM|S\$|[$€£])?\s?\d[\d,.]*/)?.[0] || undefined;
  const ratingResult = firstVisibleText(doc, [
    "[itemprop='ratingValue']",
    "[class*='rating']",
    "[class*='Rating']",
    "[aria-label*='rating']",
    "[aria-label*='star']"
  ]);
  const visibleRating = ratingResult.text || schemaValue(records, ["ratingValue", "reviewRating"]);
  const schemaTypes = readSchemaTypes(doc);
  const title = h1[0] || schemaName || ogTitle || doc.title || "";
  const foundFields = [
    title ? "title" : "",
    metaDescription ? "meta description" : "",
    descriptionText ? "description/body text" : "",
    faqQuestions.length ? "FAQ/questions" : "",
    visiblePrice ? "price" : "",
    visibleRating ? "rating/review signal" : "",
    imageAltTexts.length ? "images" : "",
    schemaTypes.length ? "schema" : ""
  ].filter(Boolean);
  const missingFields = [
    title ? "" : "title",
    descriptionText.length >= 300 ? "" : "long product description",
    faqQuestions.length >= 3 ? "" : "buyer FAQ/questions",
    visiblePrice ? "" : "visible price",
    visibleRating ? "" : "rating/review signal",
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
    schemaTypes,
    visiblePrice,
    visibleRating: visibleRating || undefined,
    bodyTextLength: bodyText.length,
    scanEvidence: {
      scannedAt: new Date().toISOString(),
      titleSource: h1[0] ? "h1" : schemaName ? "json-ld name" : ogTitle ? "open graph title" : "document title",
      descriptionSource: schemaDescription ? "json-ld description" : productText.source || (metaDescription ? "meta/open graph description" : "body text"),
      priceSource: visiblePrice ? priceResult.source || "page text" : undefined,
      ratingSource: visibleRating ? ratingResult.source || "json-ld rating" : undefined,
      imageCount: imageAltTexts.length,
      descriptionLength: descriptionText.length,
      bodyTextLength: bodyText.length,
      foundFields,
      missingFields,
      textSources: productText.sources
    }
  };
}

function scoreTone(result: ScoreResult): string {
  if (result.band === "strong") return "strong";
  if (result.band === "good") return "good";
  if (result.band === "needs_work") return "work";
  return "weak";
}

function ScoreRow({ label, result }: { label: string; result: ScoreResult }) {
  return (
    <div className="score-row">
      <span>{label}</span>
      <strong className={`score-value ${scoreTone(result)}`}>{result.score}</strong>
    </div>
  );
}

function platformName(platform: ProductPageSnapshot["platform"]): string {
  return platform.replace("_", " ");
}

function scoreSummary(report: ReturnType<typeof buildVisibilityReport>): string {
  const lowest = [
    { label: "Google/search readiness", score: report.seo.score },
    { label: "AI recommendation readiness", score: report.geo.score },
    { label: "buyer answer readiness", score: report.aeo.score }
  ].sort((a, b) => a.score - b.score)[0];

  return `${lowest.label} is the weakest at ${lowest.score}. I will help you fix that first.`;
}

function App() {
  const [snapshot, setSnapshot] = useState<ProductPageSnapshot | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean | undefined>>({});
  const [pastedBlocks, setPastedBlocks] = useState<Record<string, boolean | undefined>>({});
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => loadSavedReports());

  const report = useMemo(() => (snapshot ? buildVisibilityReport(snapshot) : null), [snapshot]);
  const prompts = useMemo(() => (snapshot ? generateFixPrompts(snapshot) : null), [snapshot]);
  const fixOutputPack = useMemo(() => (snapshot ? generateFixOutputPack(snapshot) : null), [snapshot]);
  const platformProfile = useMemo(() => (snapshot ? getPlatformProfile(snapshot.platform) : null), [snapshot]);
  const checklist = useMemo(
    () =>
      report?.publishChecklist.map((item) => ({
        ...item,
        completed: manualChecklist[item.id] ?? item.completed
      })) || [],
    [manualChecklist, report?.publishChecklist]
  );
  const fixCards = useMemo(() => (snapshot ? buildBeginnerFixCards(snapshot, checklist) : []), [checklist, snapshot]);
  const scanEvidence = snapshot?.scanEvidence;
  const nextFixCard = fixCards.find((card) => !card.completed);
  const nextOutputBlock = fixOutputPack?.blocks.find((block) => !pastedBlocks[block.id]) || fixOutputPack?.blocks[0];
  const agentMessages = useMemo<AgentMessage[]>(() => {
    if (!snapshot || !report || !fixOutputPack) {
      return [
        {
          id: "hello",
          role: "agent",
          text: "I can sit beside your ecommerce product page, scan it, and give you fixes you can paste back into the platform."
        },
        {
          id: "ask-scan",
          role: "agent",
          text: "Open a product page, then click Scan current page. I will detect the platform and show the next best fix."
        }
      ];
    }

    const missing = scanEvidence?.missingFields.length
      ? `I could not confirm: ${scanEvidence.missingFields.slice(0, 3).join(", ")}.`
      : "I found the main page fields I need for a first pass.";
    const next = nextOutputBlock
      ? `Next, copy the ${nextOutputBlock.label} and paste it into ${nextOutputBlock.pasteLocation}.`
      : "All generated blocks have been copied or marked.";

    return [
      {
        id: "detected",
        role: "agent",
        text: `I scanned this ${platformName(snapshot.platform)} page. ${scoreSummary(report)}`
      },
      {
        id: "evidence",
        role: "agent",
        text: missing
      },
      {
        id: "next",
        role: "agent",
        text: next
      }
    ];
  }, [fixOutputPack, nextOutputBlock, report, scanEvidence?.missingFields, snapshot]);

  async function scanPage() {
    setScanState("scanning");
    setCopyStatus("");

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error("No active tab found.");

      const [injectionResult] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scanProductPageInTab
      });

      const response = injectionResult?.result as ProductPageSnapshot | undefined;
      if (!response) throw new Error("No scan result returned.");
      setSnapshot(response);
      setManualChecklist({});
      setPastedBlocks({});
      setScanState("ready");
    } catch (error) {
      console.error(error);
      setScanState("error");
    }
  }

  async function copyPrompt(label: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopyStatus(`${label} copied`);
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  async function openUrl(url: string) {
    await chrome.tabs.create({ url });
  }

  async function openFullWorkspace() {
    await chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
  }

  function saveScan() {
    if (!snapshot) return;
    setSavedReports(saveReportSnapshot(snapshot, savedReports));
    setCopyStatus("Scan saved");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  async function copyNextFix() {
    if (!nextOutputBlock) return;
    await copyPrompt(nextOutputBlock.label, nextOutputBlock.content);
  }

  function markNextPasted() {
    if (!nextOutputBlock) return;
    setPastedBlocks({ ...pastedBlocks, [nextOutputBlock.id]: true });
    const matchingChecklist = checklist.find((item) => item.id === nextOutputBlock.id || nextOutputBlock.id.includes(item.id));
    if (matchingChecklist) {
      setManualChecklist({ ...manualChecklist, [matchingChecklist.id]: true });
    }
    setCopyStatus(`${nextOutputBlock.label} marked pasted`);
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  return (
    <main className="panel">
      <header className="panel-header">
        <div className="brand-mark">CV</div>
        <div>
          <h1>Commerce Visibility Copilot</h1>
          <p>{snapshot ? `Detected: ${snapshot.platform} product page` : "Open a product page and scan it."}</p>
        </div>
      </header>

      <nav className="mini-steps" aria-label="Workflow">
        <span>Chat</span>
        <span>Scan</span>
        <span>Copy</span>
        <span>Paste</span>
        <span>Re-scan</span>
      </nav>

      <section className="section agent-chat">
        <div className="agent-title">
          <Bot size={17} />
          <div>
            <h2>Ecommerce Visibility Agent</h2>
            <p>{snapshot ? `Working on ${platformName(snapshot.platform)}` : "Waiting for a product page"}</p>
          </div>
        </div>
        <div className="agent-thread">
          {agentMessages.map((message) => (
            <article className={`agent-message ${message.role}`} key={message.id}>
              <MessageCircle size={14} />
              <span>{message.text}</span>
            </article>
          ))}
        </div>
        <div className="agent-actions">
          <button onClick={scanPage} disabled={scanState === "scanning"}>
            <ScanLine size={15} />
            {scanState === "scanning" ? "Scanning..." : snapshot ? "Re-scan" : "Scan current page"}
          </button>
          {nextOutputBlock && (
            <>
              <button onClick={copyNextFix}>
                <Clipboard size={15} />
                Copy next fix
              </button>
              <button onClick={markNextPasted}>
                <Check size={15} />
                Mark pasted
              </button>
            </>
          )}
        </div>
      </section>

      {scanState === "error" && (
        <p className="status-message error">Could not scan this tab. Open a visible product page and try again.</p>
      )}
      {copyStatus && <p className="status-message success">{copyStatus}</p>}

      {report && prompts && fixOutputPack && (
        <>
          <section className="section">
            <ScoreRow label="Can Google find it?" result={report.seo} />
            <ScoreRow label="Can AI recommend it?" result={report.geo} />
            <ScoreRow label="Can buyers get answers?" result={report.aeo} />
          </section>

          {scanEvidence && (
            <section className="section evidence-panel">
              <h2>Scan evidence</h2>
              <div className="evidence-grid">
                <span>
                  Text <strong>{scanEvidence.bodyTextLength.toLocaleString()}</strong>
                </span>
                <span>
                  Description <strong>{scanEvidence.descriptionLength.toLocaleString()}</strong>
                </span>
                <span>
                  Images <strong>{scanEvidence.imageCount}</strong>
                </span>
              </div>
              <p>Found: {scanEvidence.foundFields.join(", ") || "nothing reliable yet"}</p>
              {scanEvidence.missingFields.length > 0 && (
                <p>Missing: {scanEvidence.missingFields.join(", ")}</p>
              )}
            </section>
          )}

          <section className="section">
            <h2>Fix next</h2>
            <div className="fix-card-stack compact">
              {fixCards
                .filter((card) => !card.completed)
                .slice(0, 3)
                .map((card) => (
                  <article className="fix-card" key={card.id}>
                    <div className="fix-card-header">
                      <strong>{card.title}</strong>
                      <span>{card.pasteLocation}</span>
                    </div>
                    <p>{card.plainIssue}</p>
                    <small>{card.sellerAction}</small>
                    <button onClick={() => copyPrompt(`${card.title} task`, card.claudeTask)}>
                      <Sparkles size={15} />
                      Copy Claude fix
                    </button>
                  </article>
                ))}
            </div>
          </section>

          <section className="section fix-output-panel">
            <h2>Ready-to-paste output</h2>
            <p className="helper-copy">{fixOutputPack.summary}</p>
            <div className="output-block-stack compact">
              {fixOutputPack.blocks.slice(0, 3).map((block) => (
                <article className="output-block" key={block.id}>
                  <div className="fix-card-header">
                    <strong>{block.label}</strong>
                    <span>{block.pasteLocation}</span>
                  </div>
                  <button className="secondary-button" onClick={() => copyPrompt(block.label, block.content)}>
                    <Clipboard size={16} />
                    Copy {block.label}
                  </button>
                </article>
              ))}
            </div>
          </section>

          {platformProfile && (
            <section className="section platform-panel">
              <h2>{platformProfile.label} plan</h2>
              <p>{platformProfile.primaryGoal}</p>
              <ul>
                {platformProfile.focusAreas.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="section actions">
            <button onClick={() => copyPrompt("Claude task", prompts.claudePrompt)}>
              <Sparkles size={16} />
              Copy to Claude
            </button>
            <button onClick={() => openUrl("https://claude.ai/new")}>
              <ExternalLink size={16} />
              Open Claude
            </button>
            <button onClick={() => copyPrompt("Codex task", prompts.codexPrompt)}>
              <Wrench size={16} />
              Copy to Codex
            </button>
            <button onClick={() => openUrl("https://chatgpt.com/codex")}>
              <ExternalLink size={16} />
              Open Codex
            </button>
            <button onClick={() => copyPrompt("Publish checklist", report.publishChecklist.map((item) => item.label).join("\n"))}>
              <Clipboard size={16} />
              Copy checklist
            </button>
            <button onClick={saveScan}>
              <Clipboard size={16} />
              Save scan
            </button>
            <button onClick={scanPage}>
              <RefreshCw size={16} />
              Re-scan
            </button>
          </section>

          <section className="section">
            <h2>Publish checklist</h2>
            {checklist.map((item) => (
              <label className="check-row" key={item.id}>
                <span>
                  <Check size={14} aria-hidden="true" />
                  {item.label}
                </span>
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(event) => setManualChecklist({ ...manualChecklist, [item.id]: event.target.checked })}
                />
              </label>
            ))}
          </section>

          <section className="section saved-mini">
            <h2>Saved scans</h2>
            <p>{savedReports.length ? `${savedReports.length} saved on this browser.` : "Save this scan before editing."}</p>
            <button className="secondary-button" onClick={openFullWorkspace}>
              <ExternalLink size={16} />
              Open workspace with saved scans
            </button>
          </section>

          <button className="text-link" onClick={openFullWorkspace}>
            <ExternalLink size={14} />
            Open full workspace
          </button>
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
