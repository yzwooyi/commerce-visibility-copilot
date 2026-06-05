import {
  ArrowRight,
  CheckCircle2,
  Chrome,
  Clipboard,
  ExternalLink,
  Languages,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import operatorScene from "./assets/malaysia-ecommerce-operator.png";
import { buildBeginnerFixCards } from "../../shared/fixCards";
import { checkOutput } from "../../shared/outputChecker";
import { generateFixPrompts } from "../../shared/promptTemplates";
import { buildVisibilityReport } from "../../shared/report";
import { deleteSavedReport, loadSavedReports, saveReportSnapshot } from "../../shared/savedReports";
import { getPlatformProfile } from "../../shared/platformOptimization";
import type { ChecklistItem, Platform, ProductPageSnapshot, SavedReport } from "../../shared/types";

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

const platformOptions: { value: Platform; label: string }[] = [
  { value: "unknown", label: "I just want to analyze a product page" },
  { value: "shopify", label: "Shopify / independent store" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "shopee", label: "Shopee MY" },
  { value: "lazada", label: "Lazada MY" },
  { value: "tiktok_shop", label: "TikTok Shop MY" },
  { value: "amazon", label: "Amazon" },
  { value: "independent", label: "Other independent store" }
];

interface CustomerSession {
  email: string;
  storeName: string;
  signedInAt: string;
}

const customerSessionKey = "commerce-visibility-copilot-customer-session";

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function App() {
  const [snapshot, setSnapshot] = useState<ProductPageSnapshot>(emptySnapshot);
  const [faqInput, setFaqInput] = useState("");
  const [schemaInput, setSchemaInput] = useState("");
  const [output, setOutput] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [manualChecklist, setManualChecklist] = useState<Record<string, boolean | undefined>>({});
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginStoreName, setLoginStoreName] = useState("");

  const report = useMemo(() => buildVisibilityReport(snapshot), [snapshot]);
  const prompts = useMemo(() => generateFixPrompts(snapshot), [snapshot]);
  const outputCheck = useMemo(() => checkOutput(output), [output]);
  const platformProfile = useMemo(() => getPlatformProfile(snapshot.platform), [snapshot.platform]);
  const checklist = useMemo(
    () =>
      report.publishChecklist.map((item): ChecklistItem => ({
        ...item,
        completed: manualChecklist[item.id] ?? item.completed
      })),
    [manualChecklist, report.publishChecklist]
  );
  const fixCards = useMemo(() => buildBeginnerFixCards(snapshot, checklist), [checklist, snapshot]);

  useEffect(() => {
    try {
      const savedSession = window.localStorage.getItem(customerSessionKey);
      if (!savedSession) return;
      const parsedSession = JSON.parse(savedSession) as CustomerSession;
      setCustomerSession(parsedSession);
      setLoginEmail(parsedSession.email);
      setLoginStoreName(parsedSession.storeName);
      setSavedReports(loadSavedReports(parsedSession.email));
    } catch {
      setCustomerSession(null);
    }
  }, []);

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopyStatus(`${label} copied`);
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function openExternal(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function signInCustomer() {
    const email = loginEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setCopyStatus("Enter a customer email to open the dashboard");
      window.setTimeout(() => setCopyStatus(""), 2200);
      return;
    }

    const session: CustomerSession = {
      email,
      storeName: loginStoreName.trim() || "Customer store",
      signedInAt: new Date().toISOString()
    };

    window.localStorage.setItem(customerSessionKey, JSON.stringify(session));
    setCustomerSession(session);
    setSavedReports(loadSavedReports(session.email));
    setCopyStatus("Customer dashboard opened");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function signOutCustomer() {
    window.localStorage.removeItem(customerSessionKey);
    setCustomerSession(null);
    setSavedReports([]);
    setCopyStatus("Logged out");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function saveCurrentReport() {
    if (!customerSession) {
      setCopyStatus("Log in to save this scan to your dashboard");
      window.setTimeout(() => setCopyStatus(""), 2200);
      return;
    }

    setSavedReports(saveReportSnapshot(snapshot, savedReports, customerSession.email));
    setCopyStatus("Report saved");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  function loadReport(saved: SavedReport) {
    setSnapshot(saved.snapshot);
    setFaqInput(saved.snapshot.faqQuestions.join("\n"));
    setSchemaInput(saved.snapshot.schemaTypes.join("\n"));
    setManualChecklist({});
  }

  function deleteReport(id: string) {
    setSavedReports(deleteSavedReport(id, savedReports, customerSession?.email));
  }

  function resetWorkspace() {
    setSnapshot(emptySnapshot);
    setFaqInput("");
    setSchemaInput("");
    setOutput("");
    setManualChecklist({});
  }

  const installSteps = `Commerce Visibility Copilot beta install:
1. Download or build the extension package.
2. Open chrome://extensions in Chrome.
3. Turn on Developer mode.
4. Click Load unpacked.
5. Select the dist folder.
6. Open a Malaysia ecommerce product page and click the extension.`;

  return (
    <main className="app-shell">
      <section className="install-hero">
        <div className="hero-copy">
          <div className="brand-line">
            <div className="brand-mark">CV</div>
            <span>Commerce Visibility Copilot</span>
          </div>
          <h1>Install the Chrome plugin that turns Claude and Codex into your Malaysia ecommerce growth team.</h1>
          <p>
            Built for sellers using Claude or Codex on Shopify, Shopee MY, Lazada MY, TikTok Shop MY, and
            independent stores. Scan a product page, get plain-English scores, then copy the right task to Claude or
            Codex.
          </p>
          <div className="install-actions">
            <a
              className="primary-button hero-primary"
              href="/downloads/commerce-visibility-copilot-extension.zip"
              download
            >
              <Chrome size={17} />
              Download Chrome plugin
              <ArrowRight size={16} />
            </a>
            <button className="secondary-button" onClick={() => copy("Install steps", installSteps)}>
              <Clipboard size={16} />
              Copy install steps
            </button>
            <a className="secondary-link-button" href="#workspace">
              Try the demo workspace
            </a>
          </div>
          <div className="local-proof">
            <span>
              <Store size={14} />
              Shopee MY / Lazada MY / TikTok Shop MY
            </span>
            <span>
              <Languages size={14} />
              English, BM, 中文, Manglish-ready
            </span>
            <span>
              <ShieldCheck size={14} />
              No store connection needed first
            </span>
          </div>
        </div>

        <div className="extension-preview" aria-label="Chrome plugin preview">
          <div className="scan-line" aria-hidden="true" />
          <div className="preview-header">
            <div className="brand-mark">CV</div>
            <div>
              <strong>Chrome plugin</strong>
              <span>Detected: Malaysia product page</span>
            </div>
          </div>
          <div className="preview-steps">
            <span>Scan</span>
            <span>Score</span>
            <span>Fix</span>
            <span>Publish</span>
          </div>
          <div className="product-page-mini">
            <div className="product-visual" />
            <div className="product-lines">
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="preview-score">
            <span>Can Google find it?</span>
            <strong>72</strong>
          </div>
          <div className="preview-score">
            <span>Can AI recommend it?</span>
            <strong>41</strong>
          </div>
          <div className="preview-score">
            <span>Can buyers get answers?</span>
            <strong>55</strong>
          </div>
          <button className="preview-copy">
            <Sparkles size={15} />
            Copy to Claude
          </button>
          <button className="preview-primary">
            <Wrench size={15} />
            Copy to Codex
          </button>
        </div>
      </section>

      {copyStatus && <p className="status-message success">{copyStatus}</p>}

      <section className="onboarding-strip">
        <div>
          <strong>1. Install plugin</strong>
          <span>Pin it in Chrome so it is always beside the product page.</span>
        </div>
        <div>
          <strong>2. Open product page</strong>
          <span>Use any Malaysia store page or paste details into the demo workspace.</span>
        </div>
        <div>
          <strong>3. Copy the next task</strong>
          <span>Claude writes content. Codex updates the website. You check before publishing.</span>
        </div>
      </section>

      <section className="customer-login-panel" aria-label="Customer login">
        {customerSession ? (
          <>
            <div>
              <span className="section-kicker">Customer dashboard</span>
              <h2>{customerSession.storeName}</h2>
              <p>{customerSession.email} · {savedReports.length} saved scans</p>
            </div>
            <div className="customer-login-actions">
              <a className="secondary-link-button" href="#scan-dashboard">
                View my dashboard
              </a>
              <button className="secondary-button" onClick={signOutCustomer}>
                Log out
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="section-kicker">Customer login</span>
              <h2>Log in to see your own scan dashboard.</h2>
              <p>Use an email for this beta workspace. Saved scans stay separated by customer.</p>
            </div>
            <div className="customer-login-form">
              <label>
                Email
                <input
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="seller@store.com"
                />
              </label>
              <label>
                Store name
                <input
                  value={loginStoreName}
                  onChange={(event) => setLoginStoreName(event.target.value)}
                  placeholder="My Shopee / Shopify store"
                />
              </label>
              <button className="primary-button compact" onClick={signInCustomer}>
                Open my dashboard
              </button>
            </div>
          </>
        )}
      </section>

      <section className="quick-actions" aria-label="Claude and Codex handoff">
        <button onClick={() => openExternal("https://claude.ai/new")}>
          <Sparkles size={16} />
          Open Claude
          <ExternalLink size={14} />
        </button>
        <button onClick={() => openExternal("https://chatgpt.com/codex")}>
          <Wrench size={16} />
          Open Codex
          <ExternalLink size={14} />
        </button>
        <button onClick={saveCurrentReport}>
          <Clipboard size={16} />
          Save report
        </button>
        <button onClick={resetWorkspace}>
          <RefreshCw size={16} />
          Start another product
        </button>
      </section>

      <section className="creative-grid">
        <div className="question-map-card">
          <div className="section-kicker">Malaysia buyer questions</div>
          <h2>It knows the questions local shoppers actually ask.</h2>
          <p>
            The plugin turns common Malaysia ecommerce concerns into FAQ, AI answer blocks, and publish-ready tasks for
            Claude and Codex.
          </p>
          <div className="question-chips">
            <span>halal ke?</span>
            <span>COD available?</span>
            <span>delivery to Sabah/Sarawak?</span>
            <span>适合敏感肌吗？</span>
            <span>sesuai untuk kulit berminyak?</span>
            <span>how long to see result?</span>
          </div>
        </div>
        <figure className="operator-card">
          <img src={operatorScene} alt="Malaysia ecommerce seller reviewing a product page with an AI assistant side panel" />
          <figcaption>For sellers already working between product pages, Claude, Codex, and marketplace tabs.</figcaption>
        </figure>
      </section>

      <section className="before-after-section">
        <div>
          <div className="section-kicker">Before / After</div>
          <h2>Show the improvement before asking them to trust the tool.</h2>
        </div>
        <div className="before-after-grid">
          <article className="comparison-card muted-card">
            <span>Before</span>
            <h3>Glow Serum</h3>
            <p>A nice serum for your skin.</p>
            <ul>
              <li>No buyer FAQ</li>
              <li>No AI answer block</li>
              <li>No Product or FAQ schema</li>
            </ul>
          </article>
          <article className="comparison-card after-card">
            <span>After</span>
            <h3>Hydrating Glow Serum for Dry Sensitive Skin in Malaysia</h3>
            <p>Clear product purpose, Malaysia buyer questions, AI-readable answer block, and Codex-ready page fixes.</p>
            <ul>
              <li>SEO title + meta</li>
              <li>FAQ for local buyer concerns</li>
              <li>Schema and page structure tasks</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="roles-section">
        <article>
          <Sparkles size={18} />
          <strong>Claude writes the customer-facing content</strong>
          <span>Product copy, FAQ, answer blocks, comparison language, BM/中文/English localization.</span>
        </article>
        <article>
          <Wrench size={18} />
          <strong>Codex updates the actual website</strong>
          <span>Schema, H1/H2, meta tags, FAQ section, alt text, mobile layout, and implementation checks.</span>
        </article>
      </section>

      <section className="workspace-heading" id="workspace">
        <h2>Demo workspace</h2>
        <p>Use this when the plugin cannot scan a page yet, or when a seller wants a full report before installing.</p>
      </section>

      <section className="workspace-grid top-grid">
        <div className="section intake">
          <h2>Product intake</h2>
          <label>
            Where do you sell?
            <select
              value={snapshot.platform}
              onChange={(event) => setSnapshot({ ...snapshot, platform: event.target.value as Platform })}
            >
              {platformOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product page URL
            <input
              value={snapshot.url}
              onChange={(event) => setSnapshot({ ...snapshot, url: event.target.value })}
              placeholder="https://store.com/products/glow-serum"
            />
          </label>
          <label>
            Product title
            <input
              value={snapshot.title}
              onChange={(event) =>
                setSnapshot({
                  ...snapshot,
                  title: event.target.value,
                  metaTitle: snapshot.metaTitle || event.target.value,
                  h1: event.target.value ? [event.target.value] : []
                })
              }
              placeholder="Hydrating Glow Serum for Dry Skin"
            />
          </label>
          <label>
            Meta description
            <input
              value={snapshot.metaDescription}
              onChange={(event) => setSnapshot({ ...snapshot, metaDescription: event.target.value })}
              placeholder="Short search result description"
            />
          </label>
          <label>
            Product description
            <textarea
              value={snapshot.descriptionText}
              onChange={(event) => setSnapshot({ ...snapshot, descriptionText: event.target.value })}
              placeholder="Paste product description"
            />
          </label>
          <div className="two-col-inputs">
            <label>
              FAQ questions
              <textarea
                value={faqInput}
                onChange={(event) => {
                  setFaqInput(event.target.value);
                  setSnapshot({ ...snapshot, faqQuestions: parseLines(event.target.value) });
                }}
                placeholder={"One question per line\nIs it suitable for sensitive skin?"}
              />
            </label>
            <label>
              Schema types
              <textarea
                value={schemaInput}
                onChange={(event) => {
                  setSchemaInput(event.target.value);
                  setSnapshot({ ...snapshot, schemaTypes: parseLines(event.target.value) });
                }}
                placeholder={"One type per line\nProduct\nFAQPage"}
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="secondary-button" onClick={saveCurrentReport}>
              <Clipboard size={16} />
              Save report
            </button>
            <button className="secondary-button" onClick={resetWorkspace}>
              <RefreshCw size={16} />
              Reset / re-scan manually
            </button>
          </div>
        </div>

        <div className="section">
          <h2>Visibility score</h2>
          <div className="score-card-list">
            <div className="score-card">
              <span>Can Google find it?</span>
              <strong>{report.seo.score}</strong>
              <small>{report.seo.band.replace("_", " ")}</small>
            </div>
            <div className="score-card">
              <span>Can AI recommend it?</span>
              <strong>{report.geo.score}</strong>
              <small>{report.geo.band.replace("_", " ")}</small>
            </div>
            <div className="score-card">
              <span>Can buyers get answers?</span>
              <strong>{report.aeo.score}</strong>
              <small>{report.aeo.band.replace("_", " ")}</small>
            </div>
          </div>
          <div className="fix-panel">
            <h3>
              <Search size={15} />
              What the seller should fix next
            </h3>
            <div className="fix-card-stack">
              {fixCards
                .filter((card) => !card.completed)
                .slice(0, 4)
                .map((card) => (
                  <article className="fix-card" key={card.id}>
                    <div className="fix-card-header">
                      <strong>{card.title}</strong>
                      <span>{card.pasteLocation}</span>
                    </div>
                    <p>{card.plainIssue}</p>
                    <small>{card.whyItMatters}</small>
                    <div className="fix-card-action">
                      <span>{card.sellerAction}</span>
                      <button onClick={() => copy(`${card.title} task`, card.claudeTask)}>
                        <Sparkles size={15} />
                        Copy Claude fix
                      </button>
                    </div>
                  </article>
                ))}
              {fixCards.every((card) => card.completed) && (
                <article className="fix-card done">
                  <div className="fix-card-header">
                    <strong>Ready for final check</strong>
                    <span>Output checker</span>
                  </div>
                  <p>All beginner fix cards are complete. Paste the Claude or Codex output below before publishing.</p>
                </article>
              )}
            </div>
          </div>
          {snapshot.scanEvidence && (
            <div className="platform-panel evidence-panel">
              <h3>Scan evidence</h3>
              <div className="evidence-grid">
                <span>
                  Text <strong>{snapshot.scanEvidence.bodyTextLength.toLocaleString()}</strong>
                </span>
                <span>
                  Description <strong>{snapshot.scanEvidence.descriptionLength.toLocaleString()}</strong>
                </span>
                <span>
                  Images <strong>{snapshot.scanEvidence.imageCount}</strong>
                </span>
              </div>
              <p>Found: {snapshot.scanEvidence.foundFields.join(", ") || "nothing reliable yet"}</p>
              {snapshot.scanEvidence.missingFields.length > 0 && (
                <p>Missing: {snapshot.scanEvidence.missingFields.join(", ")}</p>
              )}
            </div>
          )}
          <div className="platform-panel">
            <h3>{platformProfile.label} optimization plan</h3>
            <p>{platformProfile.primaryGoal}</p>
            <ul>
              {platformProfile.focusAreas.slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section scan-dashboard" id="scan-dashboard">
        <div>
          <h2>{customerSession ? `${customerSession.storeName} scan dashboard` : "Customer scan dashboard"}</h2>
          <p>
            {customerSession
              ? "Every saved scan shows the page, platform, score, missing items, and why it needs work."
              : "Log in above to see your own saved scans separated from other customers."}
          </p>
        </div>
        {savedReports.length > 0 ? (
          <div className="scan-dashboard-list">
            {savedReports.map((saved) => {
              const savedReport = buildVisibilityReport(saved.snapshot);
              const scores = saved.scores || {
                seo: savedReport.seo.score,
                geo: savedReport.geo.score,
                aeo: savedReport.aeo.score
              };
              const issues =
                saved.issueSummary ||
                Array.from(new Set([...savedReport.seo.reasons, ...savedReport.geo.reasons, ...savedReport.aeo.reasons])).slice(0, 3);
              const missing =
                saved.missingSummary ||
                savedReport.publishChecklist
                  .filter((item) => !item.completed)
                  .map((item) => item.label)
                  .slice(0, 3);

              return (
                <article key={saved.id}>
                  <div className="scan-card-header">
                    <div>
                      <strong>{saved.name}</strong>
                      <span>{saved.snapshot.url || "No URL saved"}</span>
                    </div>
                    <em>{saved.snapshot.platform.replace("_", " ")}</em>
                  </div>
                  <div className="scan-score-row">
                    <span>
                      SEO <strong>{scores.seo}</strong>
                    </span>
                    <span>
                      GEO <strong>{scores.geo}</strong>
                    </span>
                    <span>
                      AEO <strong>{scores.aeo}</strong>
                    </span>
                  </div>
                  <div className="scan-insight-grid">
                    <div>
                      <b>Missing</b>
                      <ul>
                        {missing.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <b>Why it scores lower</b>
                      <ul>
                        {issues.slice(0, 3).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="scan-card-footer">
                    <span>{new Date(saved.savedAt).toLocaleString()}</span>
                    <div>
                      <button onClick={() => loadReport(saved)}>Load</button>
                      <button onClick={() => deleteReport(saved.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-dashboard-preview">
            <span>{customerSession ? "Scan a product page" : "Log in with email"}</span>
            <span>{customerSession ? "Save report" : "Open customer dashboard"}</span>
            <span>{customerSession ? "Track what is missing" : "See only your scans"}</span>
          </div>
        )}
      </section>

      <section className="workspace-grid">
        <div className="section fix-workbench">
          <h2>Beginner fix cards</h2>
          <p className="helper-copy">
            Each card tells the seller what is missing, why it matters, where to paste the fix, and how to check the
            result.
          </p>
          <div className="fix-card-stack detailed">
            {fixCards.map((card) => (
              <article className={`fix-card ${card.completed ? "done" : ""}`} key={card.id}>
                <div className="fix-card-header">
                  <strong>{card.title}</strong>
                  <span>{card.completed ? "Done" : "Needs fix"}</span>
                </div>
                <p>{card.plainIssue}</p>
                <small>{card.whyItMatters}</small>
                <div className="fix-card-action">
                  <span>
                    Paste into: <b>{card.pasteLocation}</b>
                  </span>
                  <button onClick={() => copy(`${card.title} task`, card.claudeTask)}>
                    <Sparkles size={15} />
                    Copy Claude fix
                  </button>
                </div>
                <ul className="check-rule-list">
                  {card.checkRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="section prompt-panel">
          <h2>Claude fix pack</h2>
          <textarea readOnly value={prompts.claudePrompt} />
          <button className="secondary-button" onClick={() => copy("Claude task", prompts.claudePrompt)}>
            <Clipboard size={16} />
            Copy Claude task
          </button>
          <button className="secondary-button" onClick={() => openExternal("https://claude.ai/new")}>
            <ExternalLink size={16} />
            Open Claude
          </button>
        </div>
        <div className="section prompt-panel">
          <h2>Codex fix pack</h2>
          <textarea readOnly value={prompts.codexPrompt} />
          <button className="secondary-button" onClick={() => copy("Codex task", prompts.codexPrompt)}>
            <Clipboard size={16} />
            Copy Codex task
          </button>
          <button className="secondary-button" onClick={() => openExternal("https://chatgpt.com/codex")}>
            <ExternalLink size={16} />
            Open Codex
          </button>
        </div>
      </section>

      <section className="workspace-grid">
        <div className="section">
          <h2>Output checker</h2>
          <textarea
            value={output}
            onChange={(event) => setOutput(event.target.value)}
            placeholder="Paste Claude/Codex output here to check if it is ready to publish."
          />
          <div className={`result-banner ${outputCheck.status === "ready_to_publish" ? "ready" : "needs"}`}>
            <CheckCircle2 size={16} />
            {outputCheck.status === "ready_to_publish" ? "Ready to publish" : "Needs improvement"}
          </div>
          {outputCheck.issues.length > 0 && (
            <ul className="issue-list">
              {outputCheck.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="section">
          <h2>Publish checklist</h2>
          {checklist.map((item) => (
            <label className="check-row" key={item.id}>
              <span>
                <CheckCircle2 size={14} />
                {item.label}
              </span>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(event) => setManualChecklist({ ...manualChecklist, [item.id]: event.target.checked })}
              />
            </label>
          ))}
        </div>
      </section>
    </main>
  );
}
