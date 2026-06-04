import { describe, expect, it, vi } from "vitest";
import { saveReportSnapshot } from "../shared/savedReports";
import type { ProductPageSnapshot } from "../shared/types";

const snapshot: ProductPageSnapshot = {
  url: "https://shopee.com.my/product/123",
  platform: "shopee",
  title: "Glow Serum",
  metaTitle: "",
  metaDescription: "",
  h1: ["Glow Serum"],
  h2: [],
  descriptionText: "A nice serum.",
  imageAltTexts: [],
  faqQuestions: [],
  schemaTypes: []
};

describe("saved reports", () => {
  it("stores dashboard-ready score and issue summaries", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const reports = saveReportSnapshot(snapshot, [], "seller@example.com");

    expect(reports).toHaveLength(1);
    expect(reports[0].customerId).toBe("seller-example.com");
    expect(reports[0].scores).toMatchObject({ seo: expect.any(Number), geo: expect.any(Number), aeo: expect.any(Number) });
    expect(reports[0].issueSummary?.length).toBeGreaterThan(0);
    expect(reports[0].missingSummary).toContain("Rewrite Shopee MY product title");
  });
});
