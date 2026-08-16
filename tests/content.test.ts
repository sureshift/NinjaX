import { describe, it, expect } from "vitest";
import { auditContent } from "../electron/modules/seo/content";

describe("auditContent", () => {
  it("flags thin content below the word count threshold", () => {
    const issues = auditContent([
      { id: "1", url: "https://example.com/a", title: "Page A", metaDescription: "Desc A", wordCount: 50 },
    ]);
    expect(issues.some((i) => i.issueType === "thin_content")).toBe(true);
  });

  it("flags duplicate titles across pages", () => {
    const issues = auditContent([
      { id: "1", url: "https://example.com/a", title: "Same Title", metaDescription: "Desc A", wordCount: 500 },
      { id: "2", url: "https://example.com/b", title: "Same Title", metaDescription: "Desc B", wordCount: 500 },
    ]);
    expect(issues.filter((i) => i.issueType === "duplicate_title")).toHaveLength(2);
  });

  it("does not flag a single well-formed page", () => {
    const issues = auditContent([
      { id: "1", url: "https://example.com/a", title: "Unique Title", metaDescription: "Unique description", wordCount: 500 },
    ]);
    expect(issues).toHaveLength(0);
  });
});
