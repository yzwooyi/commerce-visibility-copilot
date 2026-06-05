import type { ProductPageSnapshot, SavedReport } from "./types";
import { buildVisibilityReport } from "./report";

const storageKey = "commerce-visibility-copilot-saved-reports";

type WorkflowStatus = NonNullable<SavedReport["workflowStatus"]>;

function normalizeOwnerId(ownerId?: string): string {
  return ownerId?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-") || "";
}

function keyForOwner(ownerId?: string): string {
  const normalized = normalizeOwnerId(ownerId);
  return normalized ? `${storageKey}:${normalized}` : storageKey;
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadSavedReports(ownerId?: string): SavedReport[] {
  const storage = safeStorage();
  if (!storage) return [];

  try {
    const saved = storage.getItem(keyForOwner(ownerId));
    return saved ? (JSON.parse(saved) as SavedReport[]) : [];
  } catch {
    return [];
  }
}

export function writeSavedReports(reports: SavedReport[], ownerId?: string): SavedReport[] {
  const nextReports = reports.slice(0, 10);
  const storage = safeStorage();
  if (storage) storage.setItem(keyForOwner(ownerId), JSON.stringify(nextReports));
  return nextReports;
}

export function saveReportSnapshot(
  snapshot: ProductPageSnapshot,
  existingReports = loadSavedReports(),
  ownerId?: string
): SavedReport[] {
  const name = snapshot.title.trim() || snapshot.url.trim() || "Untitled product";
  const report = buildVisibilityReport(snapshot);
  const currentScores = {
    seo: report.seo.score,
    geo: report.geo.score,
    aeo: report.aeo.score
  };
  const previousReport = existingReports.find(
    (item) => (snapshot.url && item.snapshot.url === snapshot.url) || item.name === name
  );
  const previousScores = previousReport?.scores;
  const scoreDelta = previousScores
    ? {
        seo: currentScores.seo - previousScores.seo,
        geo: currentScores.geo - previousScores.geo,
        aeo: currentScores.aeo - previousScores.aeo
      }
    : undefined;
  const issueSummary = Array.from(new Set([...report.seo.reasons, ...report.geo.reasons, ...report.aeo.reasons])).slice(0, 8);
  const missingSummary = report.publishChecklist.filter((item) => !item.completed).map((item) => item.label).slice(0, 8);
  const completedCount = report.publishChecklist.filter((item) => item.completed).length;
  const workflowStatus: WorkflowStatus =
    missingSummary.length === 0
      ? "ready_to_publish"
      : completedCount > 0 || previousReport
        ? "in_progress"
        : "needs_fix";
  const nextReports = [
    {
      id: String(Date.now()),
      name,
      savedAt: new Date().toISOString(),
      customerId: normalizeOwnerId(ownerId) || undefined,
      snapshot,
      scores: currentScores,
      scoreDelta,
      workflowStatus,
      issueSummary,
      missingSummary
    },
    ...existingReports.filter((item) => item.name !== name && (!snapshot.url || item.snapshot.url !== snapshot.url))
  ];

  return writeSavedReports(nextReports, ownerId);
}

export function deleteSavedReport(id: string, existingReports = loadSavedReports(), ownerId?: string): SavedReport[] {
  return writeSavedReports(existingReports.filter((report) => report.id !== id), ownerId);
}
