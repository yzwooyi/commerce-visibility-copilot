# Contributing

Thanks for your interest — issues and PRs are welcome.

## Setup

```bash
npm install
npm run dev     # local web app
npm test        # vitest (13 tests)
npm run build   # type-check + build
npm run package:extension   # produces dist/downloads/...zip
```

## Where things live

- `shared/` — scoring, fix-card generation, prompt templates, output checking (pure TS, the reusable core).
- `web/` — Vite + React web app.
- `extension/` — MV3 Chrome extension (side panel + background worker).
- `tests/` — Vitest unit tests.

## Before you open a PR

1. `npm test` and `npm run build` both pass (CI runs the same).
2. New logic in `shared/` comes with a test in `tests/`.
3. Keep changes focused — one concern per PR.

## Reporting

Use the issue templates. For bugs, include the page or input you scanned and what
you expected vs. what you got. For features, describe the seller workflow it helps.
