import { describe, expect, it } from "vitest";
import { checkOutput } from "../shared/outputChecker";

describe("output checker", () => {
  it("flags generic output", () => {
    const result = checkOutput("This is a great product. It is amazing and useful.");
    expect(result.status).toBe("needs_improvement");
    expect(result.issues).toContain("Output is too generic.");
  });

  it("approves specific output with FAQ and answer block", () => {
    const result = checkOutput(`
      AI answer block: This serum is best for dry sensitive skin and helps buyers who need a gentle routine.
      FAQ: Is it suitable for sensitive skin? Yes, it is designed for sensitive skin.
      FAQ: How do I use it? Apply it after cleansing.
      Product schema: Product
      FAQ schema: FAQPage
      The implementation includes schema details, suitability guidance, and buyer-ready usage answers.
    `);
    expect(result.status).toBe("ready_to_publish");
  });
});
