import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  seoAudits,
  pages,
  internalLinks,
  siteCrawlIssues,
  contentAudits,
  coreWebVitals,
  keywords,
  rankHistory,
  backlinks,
  localListings,
} from "../db/schema";

import { runTechnicalAudit, checkRobotsAndSitemap } from "../modules/seo/technical";
import { analyzeOnPage } from "../modules/seo/onpage";
import { measureCoreWebVitals } from "../modules/seo/performance";
import { crawlSite, checkRedirectChain } from "../modules/seo/architecture";
import { auditContent } from "../modules/seo/content";
import { trackKeywordRank, clusterKeywords } from "../modules/seo/keywords";
import { fetchBacklinksForDomain, analyzeAnchorTextDistribution, flagToxicBacklinks } from "../modules/seo/backlinks";
import { checkNapConsistency, Listing } from "../modules/seo/local";

export function registerSeoHandlers() {
  // ---------- Technical SEO ----------
  ipcMain.handle("seo:runTechnicalAudit", async (_event, projectId: string, url: string) => {
    const db = getDb();
    const result = await runTechnicalAudit(url);

    const audit = {
      id: randomUUID(),
      projectId,
      url,
      score: Math.max(0, 100 - result.issues.length * 10),
      issuesJson: JSON.stringify(result.issues),
      crawledAt: new Date().toISOString(),
    };
    db.insert(seoAudits).values(audit).run();

    db.insert(pages)
      .values({
        id: randomUUID(),
        projectId,
        url,
        title: result.title,
        metaDescription: result.metaDescription,
        canonicalUrl: result.canonicalUrl,
        statusCode: result.statusCode,
        indexable: result.indexable,
        robotsMeta: result.robotsMeta,
        h1Count: result.h1Count,
        wordCount: result.wordCount,
        lastCrawledAt: audit.crawledAt,
      })
      .run();

    return { audit, details: result };
  });

  ipcMain.handle("seo:checkRobotsAndSitemap", async (_event, domain: string) => {
    return checkRobotsAndSitemap(domain);
  });

  ipcMain.handle("seo:listAudits", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(seoAudits).where(eq(seoAudits.projectId, projectId)).all();
  });

  // ---------- On-page SEO ----------
  ipcMain.handle(
    "seo:analyzeOnPage",
    async (_event, url: string, targetKeyword?: string) => analyzeOnPage(url, targetKeyword)
  );

  // ---------- Performance / Core Web Vitals ----------
  ipcMain.handle("seo:measureCoreWebVitals", async (_event, projectId: string, url: string) => {
    const db = getDb();
    const result = await measureCoreWebVitals(url);
    db.insert(coreWebVitals)
      .values({
        id: randomUUID(),
        projectId,
        url,
        lcpMs: result.lcpMs,
        cls: result.cls,
        inpMs: result.inpMs,
        checkedAt: new Date().toISOString(),
      })
      .run();
    return result;
  });

  // ---------- Site architecture ----------
  ipcMain.handle("seo:crawlSite", async (_event, projectId: string, startUrl: string, maxPages?: number) => {
    const db = getDb();
    const result = await crawlSite(startUrl, maxPages ?? 50);
    const now = new Date().toISOString();

    for (const crawled of result.pages) {
      const pageId = randomUUID();
      db.insert(pages)
        .values({
          id: pageId,
          projectId,
          url: crawled.url,
          title: crawled.title,
          metaDescription: null,
          canonicalUrl: null,
          statusCode: crawled.statusCode,
          indexable: true,
          robotsMeta: null,
          h1Count: null,
          wordCount: crawled.wordCount,
          lastCrawledAt: now,
        })
        .run();

      for (const link of crawled.links) {
        db.insert(internalLinks)
          .values({ id: randomUUID(), projectId, sourcePageId: pageId, targetUrl: link, anchorText: null })
          .run();
      }
    }

    for (const broken of result.brokenLinks) {
      db.insert(siteCrawlIssues)
        .values({
          id: randomUUID(),
          projectId,
          url: broken.url,
          issueType: "broken_link",
          severity: "high",
          details: `HTTP ${broken.statusCode}`,
          detectedAt: now,
        })
        .run();
    }

    for (const orphan of result.orphanPages) {
      db.insert(siteCrawlIssues)
        .values({
          id: randomUUID(),
          projectId,
          url: orphan,
          issueType: "orphan_page",
          severity: "medium",
          details: "Not linked to from any other crawled page",
          detectedAt: now,
        })
        .run();
    }

    return result;
  });

  ipcMain.handle("seo:checkRedirectChain", async (_event, url: string) => checkRedirectChain(url));

  ipcMain.handle("seo:listCrawlIssues", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(siteCrawlIssues).where(eq(siteCrawlIssues.projectId, projectId)).all();
  });

  // ---------- Content SEO ----------
  ipcMain.handle("seo:runContentAudit", async (_event, projectId: string) => {
    const db = getDb();
    const projectPages = db.select().from(pages).where(eq(pages.projectId, projectId)).all();
    const issues = auditContent(
      projectPages.map((p) => ({ id: p.id, url: p.url, title: p.title, metaDescription: p.metaDescription, wordCount: p.wordCount }))
    );

    const now = new Date().toISOString();
    for (const issue of issues) {
      db.insert(contentAudits)
        .values({
          id: randomUUID(),
          projectId,
          pageId: issue.pageId,
          issueType: issue.issueType,
          severity: issue.severity,
          details: issue.details,
          detectedAt: now,
        })
        .run();
    }
    return issues;
  });

  ipcMain.handle("seo:listContentAudits", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(contentAudits).where(eq(contentAudits.projectId, projectId)).all();
  });

  // ---------- Keyword research & rank tracking ----------
  ipcMain.handle(
    "seo:addKeyword",
    async (_event, projectId: string, keyword: string, targetUrl: string, searchEngine: string) => {
      const db = getDb();
      const record = { id: randomUUID(), projectId, keyword, targetUrl, searchEngine, searchVolume: null, difficulty: null, cluster: null };
      db.insert(keywords).values(record).run();
      return record;
    }
  );

  ipcMain.handle("seo:listKeywords", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(keywords).where(eq(keywords.projectId, projectId)).all();
  });

  ipcMain.handle("seo:clusterKeywords", async (_event, keywordList: string[]) => {
    return Array.from(clusterKeywords(keywordList).entries());
  });

  ipcMain.handle(
    "seo:trackRank",
    async (_event, keywordId: string, keyword: string, domain: string, searchEngine: string) => {
      const db = getDb();
      const result = await trackKeywordRank(keyword, domain, searchEngine);
      db.insert(rankHistory)
        .values({ id: randomUUID(), keywordId, position: result.position, checkedAt: result.checkedAt })
        .run();
      return result;
    }
  );

  ipcMain.handle("seo:getRankHistory", async (_event, keywordId: string) => {
    const db = getDb();
    return db.select().from(rankHistory).where(eq(rankHistory.keywordId, keywordId)).all();
  });

  // ---------- Off-page / backlinks ----------
  ipcMain.handle("seo:fetchBacklinks", async (_event, projectId: string, domain: string) => {
    const db = getDb();
    const results = await fetchBacklinksForDomain(domain);
    const now = new Date().toISOString();

    const toxic = flagToxicBacklinks(results);
    const toxicSet = new Set(toxic.map((t) => t.sourceUrl));

    for (const link of results) {
      db.insert(backlinks)
        .values({
          id: randomUUID(),
          projectId,
          sourceUrl: link.sourceUrl,
          targetUrl: link.targetUrl,
          anchorText: link.anchorText,
          domainAuthority: link.domainAuthority,
          isToxic: toxicSet.has(link.sourceUrl),
          discoveredAt: now,
        })
        .run();
    }

    return { backlinks: results, anchorTextDistribution: analyzeAnchorTextDistribution(results), toxicCount: toxic.length };
  });

  ipcMain.handle("seo:listBacklinks", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(backlinks).where(eq(backlinks.projectId, projectId)).all();
  });

  // ---------- Local SEO ----------
  ipcMain.handle(
    "seo:checkNapConsistency",
    async (_event, projectId: string, canonical: Listing, listings: Listing[]) => {
      const db = getDb();
      const results = checkNapConsistency(canonical, listings);
      const now = new Date().toISOString();

      for (const result of results) {
        db.insert(localListings)
          .values({
            id: randomUUID(),
            projectId,
            platform: result.listing.platform,
            businessName: result.listing.businessName,
            address: result.listing.address,
            phone: result.listing.phone,
            napConsistent: result.isConsistent,
            checkedAt: now,
          })
          .run();
      }

      return results;
    }
  );

  ipcMain.handle("seo:listLocalListings", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(localListings).where(eq(localListings.projectId, projectId)).all();
  });
}
