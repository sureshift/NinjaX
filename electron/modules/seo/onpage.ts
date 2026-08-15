import { chromium } from "playwright";

export interface OnPageResult {
  url: string;
  headingStructure: { level: number; text: string }[];
  imagesTotal: number;
  imagesMissingAlt: number;
  internalLinkCount: number;
  externalLinkCount: number;
  keywordDensity: number | null;
  readabilityScore: number;
  issues: string[];
}

/**
 * Analyzes on-page factors for a single URL. If targetKeyword is provided,
 * also computes keyword density in the visible body text.
 */
export async function analyzeOnPage(url: string, targetKeyword?: string): Promise<OnPageResult> {
  const browser = await chromium.launch();
  const issues: string[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const headingStructure: { level: number; text: string }[] = [];
    for (let level = 1; level <= 6; level++) {
      const headings = await page.locator(`h${level}`).allTextContents();
      headings.forEach((text) => headingStructure.push({ level, text: text.trim() }));
    }
    if (!headingStructure.some((h) => h.level === 1)) issues.push("No H1 in heading structure");

    const imagesTotal = await page.locator("img").count();
    const imagesMissingAlt = await page.locator("img:not([alt])").count();
    if (imagesMissingAlt > 0) issues.push(`${imagesMissingAlt} of ${imagesTotal} images missing alt text`);

    const hostname = new URL(url).hostname;
    const allLinks = await page.locator("a[href]").evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).href)
    );
    const internalLinkCount = allLinks.filter((href) => href.includes(hostname)).length;
    const externalLinkCount = allLinks.length - internalLinkCount;
    if (internalLinkCount === 0) issues.push("No internal links found on page");

    const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    let keywordDensity: number | null = null;
    if (targetKeyword) {
      const occurrences = bodyText
        .toLowerCase()
        .split(targetKeyword.toLowerCase())
        .length - 1;
      keywordDensity = wordCount > 0 ? (occurrences / wordCount) * 100 : 0;
      if (keywordDensity === 0) issues.push(`Target keyword "${targetKeyword}" not found in body text`);
      if (keywordDensity > 3) issues.push("Keyword density above 3% - risk of keyword stuffing");
    }

    const readabilityScore = fleschReadingEase(bodyText);
    if (readabilityScore < 30) issues.push("Content readability is difficult (Flesch score below 30)");

    return {
      url,
      headingStructure,
      imagesTotal,
      imagesMissingAlt,
      internalLinkCount,
      externalLinkCount,
      keywordDensity,
      readabilityScore,
      issues,
    };
  } finally {
    await browser.close();
  }
}

/** Simplified Flesch Reading Ease score (0-100, higher = easier to read). */
function fleschReadingEase(text: string): number {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const score = 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount);
  return Math.round(Math.max(0, Math.min(100, score)));
}

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  const matches = cleaned.match(/[aeiouy]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}
