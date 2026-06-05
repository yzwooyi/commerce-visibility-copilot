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
  bodyTextLength?: number;
  scanEvidence?: ScanEvidence;
}

export interface ScanEvidence {
  scannedAt: string;
  titleSource: string;
  descriptionSource: string;
  priceSource?: string;
  ratingSource?: string;
  imageCount: number;
  descriptionLength: number;
  bodyTextLength: number;
  foundFields: string[];
  missingFields: string[];
  textSources: string[];
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  reasons: string[];
  topFixes: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface VisibilityReport {
  snapshot: ProductPageSnapshot;
  seo: ScoreResult;
  geo: ScoreResult;
  aeo: ScoreResult;
  topFixes: string[];
  publishChecklist: ChecklistItem[];
}

export interface FixPrompts {
  claudePrompt: string;
  codexPrompt: string;
}

export interface OutputCheckResult {
  status: "ready_to_publish" | "needs_improvement";
  issues: string[];
}

export interface SavedReport {
  id: string;
  name: string;
  savedAt: string;
  snapshot: ProductPageSnapshot;
  customerId?: string;
  scores?: {
    seo: number;
    geo: number;
    aeo: number;
  };
  issueSummary?: string[];
  missingSummary?: string[];
}
