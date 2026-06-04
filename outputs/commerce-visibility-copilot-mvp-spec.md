# Commerce Visibility Copilot MVP Spec

Date: 2026-06-04

## Product Positioning

Commerce Visibility Copilot is a Chrome-extension-first workflow for ecommerce users who already use Claude or Codex but do not know how to turn those tools into SEO, GEO, and AEO results.

It is not another AI chat product. It is a guided operating layer:

```text
Scan -> Score -> Fix with Claude/Codex -> Check -> Publish
```

Core promise:

> Open a product page, scan it, see what is missing, copy the right task to Claude or Codex, check the output, and publish with confidence.

## Target User

Primary user:

- Ecommerce sellers and small teams.
- Already using or willing to use Claude and/or Codex.
- Not SEO experts.
- Not developers.
- Often selling across Shopify, WooCommerce, Shopee, Lazada, TikTok Shop, Amazon, or an independent store.

User mindset:

- "I know Claude/Codex can help, but I do not know what to ask."
- "I do not know if the output is good enough."
- "I do not know where to place the content or technical changes."
- "I need something that tells me the next step."

## Product Form

### MVP Shape

1. Chrome extension side panel as the main entry point.
2. Lightweight Web App for full reports, saved products, and output checking.
3. Optional account connection later, not required during first use.

### Why Chrome Extension First

The user is already working in the browser:

- Product pages.
- Store admin.
- Claude.
- Codex.
- Competitor pages.
- Search results.

The extension should appear beside the current task and answer:

> What should I do next with this product page?

## User Flow

### Step 1: Start Without Connecting an Account

The first CTA is not "Connect your store."

Recommended first CTA:

```text
Open a product page and click Scan.
```

The extension can also ask:

```text
Where do you sell?
```

Options:

- Shopify / independent store.
- WooCommerce.
- Shopee.
- Lazada.
- TikTok Shop.
- Amazon.
- Other.
- I just want to analyze a product page.

### Step 2: Scan Current Page

The extension reads the current page only after the user clicks:

```text
Analyze this product page
```

It extracts:

- Product title.
- Product description.
- Page title.
- Meta description.
- Headings.
- Images and alt text.
- FAQ content.
- Reviews or visible ratings when present.
- Schema JSON-LD when present.
- Breadcrumbs when present.
- Main product claims.
- Buyer-question clues.

### Step 3: Show Plain-Language Scores

Do not lead with SEO jargon. Show three simple questions:

```text
Can Google find it?        SEO Score
Can AI recommend it?       GEO Score
Can buyers get answers?    AEO Score
```

Each score should include:

- Numeric score from 0 to 100.
- Status label: Weak, Needs work, Good, Strong.
- Top 3 reasons.
- First recommended fix.

### Step 4: Choose Goal

Buttons should use human language:

- Get more search traffic.
- Get recommended by AI.
- Answer buyer questions.
- Fix everything for me.

Internal mapping:

- Get more search traffic -> SEO.
- Get recommended by AI -> GEO.
- Answer buyer questions -> AEO.
- Fix everything for me -> combined fix pack.

### Step 5: Generate Fix Pack

The system generates two execution tracks.

Claude track:

- Rewrite product description.
- Generate SEO title and meta description.
- Generate FAQ.
- Generate buyer-question map.
- Generate AI answer block.
- Generate brand/entity description.
- Generate comparison copy.
- Localize content for the selected market/language.

Codex track:

- Add or validate Product schema.
- Add FAQ schema.
- Add Breadcrumb schema.
- Improve H1/H2 structure.
- Add FAQ section.
- Add comparison section.
- Improve image alt text.
- Update metadata.
- Verify mobile layout and crawlable markup.

### Step 6: User Executes in Claude/Codex

MVP actions:

- Copy to Claude.
- Copy to Codex.
- Open Claude.
- Open Codex.
- Save prompt.

Do not require Computer Use in MVP. Computer Use can become a later "Agent Mode."

### Step 7: Check Output

The user can paste back:

- Claude-generated product copy.
- Claude-generated FAQ.
- Codex implementation summary.
- Updated product page URL.
- HTML/schema snippet.

The checker returns:

- Ready to publish.
- Needs improvement.
- Missing buyer questions.
- Too generic.
- Schema still missing.
- AI cannot quote this clearly.
- Mobile or layout review needed.

### Step 8: Publish Checklist

Final checklist:

- Update product title.
- Update meta title and description.
- Update product description.
- Add FAQ.
- Add Product schema.
- Add FAQ schema.
- Add image alt text.
- Add AI answer block.
- Add comparison section if relevant.
- Re-scan page.

## SEO Engine

Goal:

> Help Google and platform search understand what the product is, who it is for, and why it matters.

Checks:

- Product title clarity.
- Core keyword presence.
- Use-case keyword presence.
- Buyer/persona keyword presence.
- Page title.
- Meta description.
- H1/H2/H3 structure.
- Product description completeness.
- Image alt text.
- Product schema.
- Offer schema.
- Review schema.
- FAQ schema.
- Breadcrumb schema.
- FAQ presence.

Plain-language output examples:

- "Google may not understand what this product is for."
- "Your page has no meta description."
- "Your product title does not mention the main use case."
- "Your images are missing useful alt text."
- "Your page is missing Product and FAQ schema."

## GEO Engine

Goal:

> Help AI answer engines understand, summarize, and cite the product.

Checks:

- Clear brand/entity description.
- Product solves a specific problem.
- Clear target customer.
- Clear use cases.
- Clear "not for" guidance when needed.
- Comparison with alternatives.
- Trust and proof points.
- Direct answer block.
- FAQ structure.
- Crawlable structured content.

Plain-language output examples:

- "AI will struggle to know who this product is best for."
- "The page does not include a clear answer block AI can quote."
- "The product is not clearly differentiated from competitors."

## AEO Engine

Goal:

> Help the page answer buyer questions before the buyer leaves.

Question categories:

- Who is this for?
- What problem does it solve?
- How do I use it?
- Is it safe or suitable for me?
- How long does it take to work?
- What makes it different?
- Is it worth the price?
- What are the shipping/return details?
- How does it compare with another product?

Plain-language output examples:

- "Your page does not answer the top buyer questions."
- "There is no usage guidance."
- "There is no comparison section."
- "The FAQ does not address buying hesitation."

## Claude Prompt Pack

### Product Page Rewrite

```text
You are an ecommerce SEO, GEO, and AEO strategist. Rewrite this product page so it is clear for buyers, search engines, and AI answer engines.

Product data:
[PASTE PRODUCT DATA]

Target market:
[MARKET]

Target buyer:
[BUYER]

Create:
1. SEO product title.
2. Meta title under 60 characters.
3. Meta description under 155 characters.
4. Improved product description.
5. 8 buyer-focused FAQ questions and answers.
6. A short AI answer block that explains who this product is for, what problem it solves, and why it is different.
7. Suggested image alt text.
8. A comparison paragraph against common alternatives.

Keep the writing natural, specific, and useful. Avoid generic AI-sounding claims.
```

### Buyer Question Map

```text
Based on this product, create a buyer question map for SEO, GEO, and AEO.

Product data:
[PASTE PRODUCT DATA]

Group questions into:
1. Purchase intent.
2. Suitability.
3. Usage.
4. Safety or risk.
5. Comparison.
6. Value and pricing.
7. Shipping or after-sales.

For each question, write a concise answer that can be used on a product page or FAQ section.
```

## Codex Prompt Pack

### Product Page Technical SEO Fix

```text
You are improving an ecommerce product page for SEO, GEO, and AEO.

Goal:
Implement the supplied content improvements without changing the visual design more than necessary.

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

Inputs:
[PASTE PAGE URL, CONTENT, AND CLAUDE OUTPUT]

After implementation, report:
- Files changed.
- Metadata updated.
- Schema added.
- FAQ added.
- Tests or checks run.
- Remaining risks.
```

### Page Audit Prompt

```text
Audit this ecommerce product page for SEO, GEO, and AEO implementation quality.

Check:
1. Metadata.
2. Headings.
3. Product description clarity.
4. Image alt text.
5. Product schema.
6. FAQ schema.
7. Buyer FAQ coverage.
8. AI answer block presence.
9. Mobile readability.
10. Any layout or accessibility issues.

Return a prioritized fix list and do not change files until I approve.
```

## Chrome Extension UI

### Side Panel Layout

```text
Header
Commerce Visibility Copilot
Detected: Product page

Workflow
Scan -> Score -> Fix -> Check -> Publish

Scores
Can Google find it?        72
Can AI recommend it?       41
Can buyers get answers?    55

Top Fixes
1. Add buyer FAQ.
2. Improve product title.
3. Add Product + FAQ schema.

Actions
[Write better content with Claude]
[Fix this page with Codex]
[Check if ready to publish]

Publish Checklist
[ ] Update title
[ ] Add FAQ
[ ] Add schema
[ ] Add AI answer block
```

### UI Principles

- Use plain language instead of acronyms.
- One primary action at a time.
- Keep scores visible.
- Keep top fixes short.
- Make copy buttons obvious.
- Use checkboxes for publish readiness.
- Avoid dense SEO charts in the extension.
- Keep full reports in the Web App.

## Web App UI

Main views:

1. Product intake.
2. Visibility report.
3. Question map.
4. Claude fix pack.
5. Codex fix pack.
6. Output checker.
7. Publish checklist.
8. Product history.

Web App exists to support:

- Saved products.
- Brand knowledge base.
- Historical reports.
- Team use.
- Batch optimization later.
- Paid plan features.

## Account Connection Policy

Do not ask for account connection before the first scan.

No account needed:

- Scan a visible page.
- Paste product data.
- Generate scores.
- Generate Claude prompts.
- Generate Codex prompts.
- Check pasted output.
- View a one-off report.

Account connection needed:

- Save product library.
- Track history.
- Batch optimize products.
- Auto-write changes back to store.
- Team workspace.
- Export recurring reports.

## Agent / Computer Use Policy

Computer Use should not be MVP default.

Future modes:

1. Safe Mode: copy prompts and checklist.
2. Guided Mode: extension prepares fields, user confirms.
3. Agent Mode: Claude/Codex or another agent applies changes with explicit approval.

Forbidden by default:

- Payment actions.
- Orders.
- Refunds.
- Customer data mutation.
- Shipping/tax/banking settings.
- Publishing without user confirmation.
- Deleting products or theme files.

## MVP Scope

Build these first:

1. Chrome extension side panel.
2. Current page scanner.
3. SEO/GEO/AEO scoring rules.
4. Top fixes.
5. Claude prompt generator.
6. Codex prompt generator.
7. Output checker.
8. Publish checklist.
9. Lightweight Web App report page.

Do not build in MVP:

- Shopify OAuth.
- Shopee/Lazada/TikTok API integrations.
- Computer Use agent mode.
- Rank tracking.
- Full team collaboration.
- Automated write-back.
- Billing complexity beyond a simple waitlist or plan gate.

## Chrome Web Store Readiness

Extension purpose:

> Analyze ecommerce product pages and generate SEO, GEO, and AEO fix tasks for Claude, Codex, and ecommerce teams.

Required:

- Manifest V3.
- Minimal permissions.
- Privacy policy.
- Clear data handling explanation.
- Store screenshots.
- Icon set.
- Non-official branding: do not imply official Claude or Codex partnership.
- Single-purpose listing.

Permissions principle:

- Read current page only after user action.
- Avoid broad host permissions where possible.
- Do not collect customer/order/payment data.

## Pricing Hypothesis

Free:

- 3 scans per month.
- Copy Claude/Codex prompts.
- Basic checklist.

Starter:

- More scans.
- Saved reports.
- Output checker.
- Export checklist.

Pro:

- Product library.
- Brand knowledge base.
- Batch prompt generation.
- Team comments.
- Report export.

Future higher tier:

- Shopify integration.
- Automated write-back.
- Batch SKU optimization.
- Agency client reports.

## Success Criteria

MVP is successful if a non-technical seller can:

1. Open a product page.
2. Scan it with the extension.
3. Understand the top issues.
4. Copy a Claude task.
5. Copy a Codex task.
6. Paste output back for checking.
7. Know whether the result is ready to publish.

The product fails if the user has to understand SEO/GEO/AEO terminology before taking action.
