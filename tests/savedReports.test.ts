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
    expect(reports[0].workflowStatus).toBe("needs_fix");
    expect(reports[0].issueSummary?.length).toBeGreaterThan(0);
    expect(reports[0].missingSummary).toContain("Rewrite Shopee MY product title");
  });

  it("stores before and after score deltas for repeated product scans", () => {
    vi.spyOn(Date, "now").mockReturnValue(456);
    const firstReports = saveReportSnapshot(snapshot, [], "seller@example.com");
    const improvedSnapshot: ProductPageSnapshot = {
      ...snapshot,
      title: "Hydrating Glow Serum 30ml for Dry Sensitive Skin Malaysia",
      descriptionText:
        "This hydrating serum is suitable for dry and sensitive skin. It helps improve daily skincare routines. How to use: apply after cleansing. Delivery, COD, return, warranty, authentic product, rating proof and comparison against alternatives are included. ".repeat(3),
      faqQuestions: [
        "Is it suitable for sensitive skin?",
        "How do I use it?",
        "Is COD available?",
        "Can I return it?",
        "How is it different from alternatives?"
      ],
      visiblePrice: "RM29.90",
      visibleRating: "4.8"
    };

    const secondReports = saveReportSnapshot(improvedSnapshot, firstReports, "seller@example.com");

    expect(secondReports).toHaveLength(1);
    expect(secondReports[0].scoreDelta?.seo).toBeGreaterThan(0);
    expect(secondReports[0].scoreDelta?.aeo).toBeGreaterThan(0);
    expect(secondReports[0].workflowStatus).toBe("ready_to_publish");
  });
});
