import { chromium } from "playwright";

export interface AuditResult {
  score: number;
  issues: string[];
}

/**
 * Loads a page headlessly and runs a basic set of technical SEO checks.
 * Expand this over time: broken links, image alt text, structured data,
 * page speed metrics, mobile viewport, etc.
 */
export async function crawlPage(url: string): Promise<AuditResult> {
  const browser = await chromium.launch();
  const issues: string[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const title = await page.title();
    if (!title) issues.push("Missing <title> tag");

    const metaDescription = await page
      .locator('meta[name="description"]')
      .getAttribute("content")
      .catch(() => null);
    if (!metaDescription) issues.push("Missing meta description");

    const h1Count = await page.locator("h1").count();
    if (h1Count === 0) issues.push("No <h1> found");
    if (h1Count > 1) issues.push("Multiple <h1> tags found");

    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    if (imagesWithoutAlt > 0) issues.push(`${imagesWithoutAlt} image(s) missing alt text`);
  } finally {
    await browser.close();
  }

  const score = Math.max(0, 100 - issues.length * 15);
  return { score, issues };
}
