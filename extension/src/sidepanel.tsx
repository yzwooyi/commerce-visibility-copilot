import { Check, Clipboard, ExternalLink, RefreshCw, ScanLine, Sparkles, Wrench } from "lucide-react";
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { buildBeginnerFixCards } from "../../shared/fixCards";
import { generateFixPrompts } from "../../shared/promptTemplates";
import { buildVisibilityReport } from "../../shared/report";
import { loadSavedReports, saveReportSnapshot } from "../../shared/savedReports";
import { getPlatformProfile } from "../../shared/platformOptimization";
import type { ProductPageSnapshot, SavedReport, ScoreResult } from "../../shared/types";
import "../../web/src/styles.css";

type ScanState = "idle" | "scanning" | "ready" | "error";

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

  const doc = document;
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
  const visiblePrice =
    firstVisibleText(doc, ["[itemprop='price']", "[class*='price']", "[data-price]"]).match(/[$€£RM]?\s?\d[\d,.]*/)?.[0] ||
    undefined;
  const visibleRating = firstVisibleText(doc, ["[itemprop='ratingValue']", "[class*='rating']", "[aria-label*='rating']"]);

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
    visiblePrice,
    visibleRating: visibleRating || undefined
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

function App() {
  const [snapshot, setSnapshot] = useState<ProductPageSnapshot | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean | undefined>>({});
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => loadSavedReports());

  const report = useMemo(() => (snapshot ? buildVisibilityReport(snapshot) : null), [snapshot]);
  const prompts = useMemo(() => (snapshot ? generateFixPrompts(snapshot) : null), [snapshot]);
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
        <span>Scan</span>
        <span>Score</span>
        <span>Fix</span>
        <span>Check</span>
        <span>Publish</span>
      </nav>

      {!snapshot && (
        <section className="section onboarding-card">
          <h2>First scan</h2>
          <ol className="fix-list">
            <li>Open a product page in Chrome.</li>
            <li>Click analyze so the plugin reads only this tab.</li>
            <li>Copy the Claude or Codex task.</li>
            <li>Paste the result back in the full workspace before publishing.</li>
          </ol>
        </section>
      )}

      <button className="primary-button" onClick={scanPage} disabled={scanState === "scanning"}>
        <ScanLine size={16} />
        {scanState === "scanning" ? "Scanning page..." : snapshot ? "Re-scan this product page" : "Analyze this product page"}
      </button>

      {scanState === "error" && (
        <p className="status-message error">Could not scan this tab. Open a visible product page and try again.</p>
      )}
      {copyStatus && <p className="status-message success">{copyStatus}</p>}

      {report && prompts && (
        <>
          <section className="section">
            <ScoreRow label="Can Google find it?" result={report.seo} />
            <ScoreRow label="Can AI recommend it?" result={report.geo} />
            <ScoreRow label="Can buyers get answers?" result={report.aeo} />
          </section>

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
