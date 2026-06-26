# Commerce Visibility Copilot

A Chrome extension + web app that scans an ecommerce product page, scores it for
**SEO, GEO (generative-engine optimization), and AEO (answer-engine optimization)**,
and turns the gaps into ready-to-paste **tasks for Claude and Codex** — then checks
the AI's output before you publish.

> Scan → Score → Fix with Claude/Codex → Check → Publish

It is not another AI chat product. It is a guided operating layer for ecommerce
sellers who already have Claude/Codex but don't know *what to ask* or *whether the
output is good enough*.

## Why it exists

Sellers across Shopify, WooCommerce, Shopee, Lazada, TikTok Shop, and Amazon know
AI can improve their listings, but they aren't SEO experts or developers. This tool
closes that gap: it inspects the page they're already looking at, tells them exactly
what's missing, and generates the precise prompt to fix it — then validates the
result so they don't ship a hallucination.

## Features

- **One-click page scan** — runs only on user action, no store-account connection required.
- **Three scoring engines** — SEO, GEO, and AEO scores with concrete reasons (`shared/*Scoring.ts`).
- **Fix cards** — each gap becomes a copy-paste task for Claude or Codex (`shared/fixCards.ts`, `shared/promptTemplates.ts`).
- **Output checker** — paste the AI's result back; it's validated against the original requirements before publish (`shared/outputChecker.ts`).
- **Saved reports** — track products over time (`shared/savedReports.ts`).
- **Web app + MV3 extension** — extension side panel for in-flow use, web app for full reports.

## Install

See [INSTALL.md](INSTALL.md).

```bash
npm install
npm run dev        # local web app
npm test           # 13 tests
npm run build && npm run package:extension   # Chrome extension zip
```

Load the unpacked `dist` folder via `chrome://extensions` (Developer mode) to use the side panel.

## Architecture

- `extension/` — MV3 Chrome extension (side panel UI, background worker).
- `web/` — Vite + React web app for full reports.
- `shared/` — scoring, fix-card generation, prompt templates, and output checking (the reusable core; framework-agnostic TypeScript).
- `tests/` — Vitest unit tests for the scoring and fix/check logic.

## Status

Early but working (`v0.1.0`): the scan/score/fix/check loop runs end-to-end and the
core logic is covered by tests. Roadmap: optional store-account connection, more
platform-specific rules, and packaged Chrome Web Store release.

## License

MIT — see [LICENSE](LICENSE).
