import { chromium, Page } from "playwright";

export interface TechnicalAuditResult {
  url: string;
  statusCode: number | null;
  isHttps: boolean;
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robotsMeta: string | null;
  indexable: boolean;
  hasViewportMeta: boolean;
  structuredDataTypes: string[];
  hreflangTags: { lang: string; href: string }[];
  h1Count: number;
  wordCount: number;
  issues: string[];
}

/**
 * Runs the full technical SEO check set against a single URL. This is the
 * foundation both the on-page and site-architecture crawlers build on top of.
 */
export async function runTechnicalAudit(url: string): Promise<TechnicalAuditResult> {
  const browser = await chromium.launch();
  const issues: string[] = [];

  try {
    const page = await browser.newPage();

    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const statusCode = response?.status() ?? null;

    if (statusCode && statusCode >= 400) issues.push(`Page returned HTTP ${statusCode}`);

    const isHttps = url.startsWith("https://");
    if (!isHttps) issues.push("Page is not served over HTTPS");

    const title = await page.title();
    if (!title) issues.push("Missing <title> tag");
    else if (title.length > 60) issues.push("Title tag longer than 60 characters");

    const metaDescription = await getMetaContent(page, "description");
    if (!metaDescription) issues.push("Missing meta description");
    else if (metaDescription.length > 160) issues.push("Meta description longer than 160 characters");

    const canonicalUrl = await page
      .locator('link[rel="canonical"]')
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (!canonicalUrl) issues.push("Missing canonical tag");

    const robotsMeta = await getMetaContent(page, "robots");
    const indexable = !robotsMeta?.toLowerCase().includes("noindex");
    if (!indexable) issues.push("Page is set to noindex");

    const hasViewportMeta = (await page.locator('meta[name="viewport"]').count()) > 0;
    if (!hasViewportMeta) issues.push("Missing mobile viewport meta tag");

    const structuredDataTypes = await extractStructuredDataTypes(page);
    if (structuredDataTypes.length === 0) issues.push("No structured data (JSON-LD) found");

    const hreflangTags = await extractHreflang(page);

    const h1Count = await page.locator("h1").count();
    if (h1Count === 0) issues.push("No <h1> found");
    if (h1Count > 1) issues.push("Multiple <h1> tags found");

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 300) issues.push("Thin content: fewer than 300 words");

    return {
      url,
      statusCode,
      isHttps,
      title,
      metaDescription,
      canonicalUrl,
      robotsMeta,
      indexable,
      hasViewportMeta,
      structuredDataTypes,
      hreflangTags,
      h1Count,
      wordCount,
      issues,
    };
  } finally {
    await browser.close();
  }
}

async function getMetaContent(page: Page, name: string): Promise<string | null> {
  return page.locator(`meta[name="${name}"]`).first().getAttribute("content").catch(() => null);
}

async function extractStructuredDataTypes(page: Page): Promise<string[]> {
  const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types: string[] = [];
  for (const raw of scripts) {
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item["@type"]) types.push(item["@type"]);
      }
    } catch {
      // Malformed JSON-LD block - ignore, don't fail the whole audit for it.
    }
  }
  return types;
}

async function extractHreflang(page: Page): Promise<{ lang: string; href: string }[]> {
  const links = await page.locator('link[rel="alternate"][hreflang]').all();
  const tags: { lang: string; href: string }[] = [];
  for (const link of links) {
    const lang = await link.getAttribute("hreflang");
    const href = await link.getAttribute("href");
    if (lang && href) tags.push({ lang, href });
  }
  return tags;
}

/**
 * Checks for the presence and basic validity of robots.txt and the XML sitemap
 * referenced within it (or at the conventional /sitemap.xml path).
 */
export async function checkRobotsAndSitemap(domain: string): Promise<{
  robotsTxtFound: boolean;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  issues: string[];
}> {
  const issues: string[] = [];
  const base = domain.replace(/\/$/, "");
  let robotsTxtFound = false;
  let sitemapUrl: string | null = null;

  try {
    const robotsRes = await fetch(`${base}/robots.txt`);
    robotsTxtFound = robotsRes.ok;
    if (robotsTxtFound) {
      const body = await robotsRes.text();
      const match = body.match(/Sitemap:\s*(\S+)/i);
      if (match) sitemapUrl = match[1];
    } else {
      issues.push("robots.txt not found or not accessible");
    }
  } catch {
    issues.push("Could not fetch robots.txt");
  }

  const candidateSitemap = sitemapUrl ?? `${base}/sitemap.xml`;
  let sitemapFound = false;
  try {
    const sitemapRes = await fetch(candidateSitemap);
    sitemapFound = sitemapRes.ok;
    if (!sitemapFound) issues.push("XML sitemap not found at expected location");
  } catch {
    issues.push("Could not fetch XML sitemap");
  }

  return { robotsTxtFound, sitemapFound, sitemapUrl: sitemapFound ? candidateSitemap : null, issues };
}
