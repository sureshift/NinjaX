import { chromium } from "playwright";

export interface CrawledPage {
  url: string;
  title: string | null;
  statusCode: number | null;
  wordCount: number;
  links: string[];
}

export interface SiteCrawlResult {
  pages: CrawledPage[];
  brokenLinks: { url: string; statusCode: number }[];
  orphanPages: string[];
  redirectChains: { url: string; chain: string[] }[];
}

/**
 * Breadth-first crawl of a site starting from startUrl, staying within the
 * same hostname, up to maxPages. Builds the page set and internal link graph
 * used for orphan-page and broken-link detection.
 */
export async function crawlSite(startUrl: string, maxPages = 50): Promise<SiteCrawlResult> {
  const hostname = new URL(startUrl).hostname;
  const visited = new Set<string>();
  const queue: string[] = [startUrl];
  const pages: CrawledPage[] = [];
  const linkedUrls = new Set<string>();
  const brokenLinks: { url: string; statusCode: number }[] = [];

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      let statusCode: number | null = null;
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
        statusCode = response?.status() ?? null;
      } catch {
        brokenLinks.push({ url, statusCode: 0 });
        continue;
      }

      if (statusCode && statusCode >= 400) {
        brokenLinks.push({ url, statusCode });
        continue;
      }

      const title = await page.title().catch(() => null);
      const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
      const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

      const hrefs = await page
        .locator("a[href]")
        .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href));

      const sameSiteLinks = hrefs.filter((href) => {
        try {
          return new URL(href).hostname === hostname;
        } catch {
          return false;
        }
      });

      sameSiteLinks.forEach((link) => {
        linkedUrls.add(link);
        if (!visited.has(link) && !queue.includes(link)) queue.push(link);
      });

      pages.push({ url, title, statusCode, wordCount, links: sameSiteLinks });
    }
  } finally {
    await browser.close();
  }

  // Orphan pages: crawled successfully but never referenced by any other page's links
  const orphanPages = pages
    .map((p) => p.url)
    .filter((url) => url !== startUrl && !linkedUrls.has(url));

  return {
    pages,
    brokenLinks,
    orphanPages,
    redirectChains: [], // populated separately by checkRedirectChain for flagged URLs
  };
}

/**
 * Follows redirects manually (fetch with redirect: 'manual') to surface
 * chains of 3+ hops, which dilute link equity and slow crawling.
 */
export async function checkRedirectChain(url: string, maxHops = 10): Promise<string[]> {
  const chain: string[] = [url];
  let current = url;

  for (let i = 0; i < maxHops; i++) {
    const response = await fetch(current, { redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      if (!next) break;
      const resolved = new URL(next, current).toString();
      chain.push(resolved);
      current = resolved;
    } else {
      break;
    }
  }

  return chain;
}
