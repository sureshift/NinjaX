export interface ContentAuditIssue {
  pageId: string | null;
  url: string;
  issueType: "thin_content" | "duplicate_title" | "duplicate_meta_description" | "missing_title" | "missing_meta_description";
  severity: "low" | "medium" | "high";
  details: string;
}

interface PageRecord {
  id: string;
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
}

const THIN_CONTENT_THRESHOLD = 300;

/**
 * Runs a content audit across every page already stored for a project.
 * Pure function over the page records - call this after a site crawl has
 * populated the `pages` table via electron/modules/seo/architecture.ts.
 */
export function auditContent(pages: PageRecord[]): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = [];

  const titleGroups = groupBy(pages, (p) => p.title?.trim().toLowerCase() || null);
  const metaGroups = groupBy(pages, (p) => p.metaDescription?.trim().toLowerCase() || null);

  for (const page of pages) {
    if ((page.wordCount ?? 0) < THIN_CONTENT_THRESHOLD) {
      issues.push({
        pageId: page.id,
        url: page.url,
        issueType: "thin_content",
        severity: "medium",
        details: `${page.wordCount ?? 0} words (below ${THIN_CONTENT_THRESHOLD} threshold)`,
      });
    }

    if (!page.title) {
      issues.push({ pageId: page.id, url: page.url, issueType: "missing_title", severity: "high", details: "No <title> tag" });
    } else if (titleGroups.get(page.title.trim().toLowerCase())!.length > 1) {
      issues.push({
        pageId: page.id,
        url: page.url,
        issueType: "duplicate_title",
        severity: "high",
        details: `Shared with ${titleGroups.get(page.title.trim().toLowerCase())!.length - 1} other page(s)`,
      });
    }

    if (!page.metaDescription) {
      issues.push({
        pageId: page.id,
        url: page.url,
        issueType: "missing_meta_description",
        severity: "medium",
        details: "No meta description",
      });
    } else if (metaGroups.get(page.metaDescription.trim().toLowerCase())!.length > 1) {
      issues.push({
        pageId: page.id,
        url: page.url,
        issueType: "duplicate_meta_description",
        severity: "medium",
        details: `Shared with ${metaGroups.get(page.metaDescription.trim().toLowerCase())!.length - 1} other page(s)`,
      });
    }
  }

  return issues;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string | null): Map<string | null, T[]> {
  const map = new Map<string | null, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}
