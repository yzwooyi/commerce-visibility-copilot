# Commerce Visibility Copilot Install

## Local Web App

```bash
npm install
npm run dev
```

Open the local Vite URL and use the demo workspace to enter a product page manually.

## Build

```bash
npm test
npm run build
npm run package:extension
```

The Chrome extension package is generated at:

```text
dist/downloads/commerce-visibility-copilot-extension.zip
```

## Chrome Extension MVP

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click `Load unpacked`.
4. Select the local `dist` folder after running `npm run build`.
5. Open a Malaysia ecommerce product page.
6. Click the extension side panel and run `Analyze this product page`.

The MVP scans only after user action and does not connect store accounts.
