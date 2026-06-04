import { scoreAeo } from "./aeoScoring";
import { generatePublishChecklist } from "./checklist";
import { scoreGeo } from "./geoScoring";
import { scoreSeo } from "./seoScoring";
import type { ProductPageSnapshot, VisibilityReport } from "./types";

export function buildVisibilityReport(snapshot: ProductPageSnapshot): VisibilityReport {
  const seo = scoreSeo(snapshot);
  const geo = scoreGeo(snapshot);
  const aeo = scoreAeo(snapshot);

  return {
    snapshot,
    seo,
    geo,
    aeo,
    topFixes: Array.from(new Set([...seo.topFixes, ...geo.topFixes, ...aeo.topFixes])).slice(0, 5),
    publishChecklist: generatePublishChecklist(snapshot)
  };
}
