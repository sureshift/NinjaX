import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { aiGeneratedContent, aiReports, aiSuggestedFixes, seoAudits, contentAudits, siteCrawlIssues, keywords, backlinks, competitors, pages } from "../db/schema";
import { generateContent, ContentRequest } from "../modules/ai/content";
import { analyzeSite } from "../modules/ai/analysis";
import { generateSeoReport } from "../modules/ai/reports";
import { draftFixesForIssues, RemediableIssue } from "../modules/ai/remediation";
import { saveAiProviderConfig, loadAiProviderConfig, AiProviderConfig } from "../services/aiSettings";

export function registerAiHandlers() {
  // ---------- Provider configuration ----------
  ipcMain.handle("ai:saveProviderConfig", async (_event, config: AiProviderConfig) => {
    saveAiProviderConfig(config);
    return { ok: true };
  });

  ipcMain.handle("ai:getProviderConfig", async () => {
    const config = loadAiProviderConfig();
    if (!config) return null;
    // Never send the decrypted API key back to the renderer.
    if (config.kind === "offline_ollama") return config;
    return { ...config, apiKey: "••••••••" };
  });

  // ---------- Content writing ----------
  ipcMain.handle("ai:generateContent", async (_event, projectId: string, request: ContentRequest) => {
    const db = getDb();
    const content = await generateContent(request);

    const record = {
      id: randomUUID(),
      projectId,
      contentType: request.contentType,
      topic: request.topic,
      content,
      generatedAt: new Date().toISOString(),
    };
    db.insert(aiGeneratedContent).values(record).run();
    return record;
  });

  ipcMain.handle("ai:listGeneratedContent", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(aiGeneratedContent).where(eq(aiGeneratedContent.projectId, projectId)).all();
  });

  // ---------- Analysis ----------
  ipcMain.handle("ai:analyzeSite", async (_event, projectId: string) => {
    const db = getDb();

    const audits = db.select().from(seoAudits).where(eq(seoAudits.projectId, projectId)).all();
    const technicalIssues = audits.flatMap((a) => (a.issuesJson ? (JSON.parse(a.issuesJson) as string[]) : []));

    const contentIssueRows = db.select().from(contentAudits).where(eq(contentAudits.projectId, projectId)).all();
    const crawlIssueRows = db.select().from(siteCrawlIssues).where(eq(siteCrawlIssues.projectId, projectId)).all();
    const keywordRows = db.select().from(keywords).where(eq(keywords.projectId, projectId)).all();
    const backlinkRows = db.select().from(backlinks).where(eq(backlinks.projectId, projectId)).all();

    const pageById = new Map(db.select().from(pages).where(eq(pages.projectId, projectId)).all().map((p) => [p.id, p.url]));

    return analyzeSite({
      technicalIssues,
      contentIssues: contentIssueRows.map((c) => ({
        url: pageById.get(c.pageId ?? "") ?? c.pageId ?? "unknown",
        issueType: c.issueType,
        details: c.details ?? "",
      })),
      crawlIssues: crawlIssueRows.map((c) => ({ url: c.url, issueType: c.issueType, details: c.details ?? "" })),
      keywordCount: keywordRows.length,
      backlinkCount: backlinkRows.filter((b) => !b.competitorId).length,
      toxicBacklinkCount: backlinkRows.filter((b) => !b.competitorId && b.isToxic).length,
    });
  });

  // ---------- Reports ----------
  ipcMain.handle("ai:generateReport", async (_event, projectId: string, projectName: string, domain: string) => {
    const db = getDb();

    const audits = db.select().from(seoAudits).where(eq(seoAudits.projectId, projectId)).all();
    const avgScore = audits.length ? audits.reduce((sum, a) => sum + (a.score ?? 0), 0) / audits.length : null;

    const contentIssueRows = db.select().from(contentAudits).where(eq(contentAudits.projectId, projectId)).all();
    const crawlIssueRows = db.select().from(siteCrawlIssues).where(eq(siteCrawlIssues.projectId, projectId)).all();
    const allPages = db.select().from(pages).where(eq(pages.projectId, projectId)).all();
    const keywordRows = db.select().from(keywords).where(eq(keywords.projectId, projectId)).all();
    const backlinkRows = db.select().from(backlinks).where(eq(backlinks.projectId, projectId)).all();
    const competitorRows = db.select().from(competitors).where(eq(competitors.projectId, projectId)).all();

    const topIssues = [
      ...contentIssueRows.map((c) => `${c.issueType} (${c.severity})`),
      ...crawlIssueRows.map((c) => `${c.issueType} (${c.severity})`),
    ].slice(0, 10);

    const markdown = await generateSeoReport({
      projectName,
      domain,
      auditScoreAvg: avgScore,
      totalPagesCrawled: allPages.length,
      totalIssues: contentIssueRows.length + crawlIssueRows.length,
      topIssues,
      keywordCount: keywordRows.length,
      backlinkCount: backlinkRows.filter((b) => !b.competitorId).length,
      competitorCount: competitorRows.length,
    });

    const record = {
      id: randomUUID(),
      projectId,
      title: `SEO Report - ${projectName} - ${new Date().toLocaleDateString()}`,
      contentMarkdown: markdown,
      generatedAt: new Date().toISOString(),
    };
    db.insert(aiReports).values(record).run();
    return record;
  });

  ipcMain.handle("ai:listReports", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(aiReports).where(eq(aiReports.projectId, projectId)).all();
  });

  // ---------- Remediation: AI drafts fixes for open issues ----------
  ipcMain.handle("ai:draftFixesForContentIssues", async (_event, projectId: string) => {
    const db = getDb();
    const issueRows = db.select().from(contentAudits).where(eq(contentAudits.projectId, projectId)).all();
    const pageById = new Map(db.select().from(pages).where(eq(pages.projectId, projectId)).all().map((p) => [p.id, p.url]));

    const issues: RemediableIssue[] = issueRows.map((row) => ({
      id: row.id,
      url: pageById.get(row.pageId ?? "") ?? row.pageId ?? "unknown",
      issueType: row.issueType,
      details: row.details ?? "",
    }));

    const fixes = await draftFixesForIssues(issues);
    const now = new Date().toISOString();

    for (const fix of fixes) {
      db.insert(aiSuggestedFixes)
        .values({
          id: randomUUID(),
          projectId,
          issueSource: "content",
          issueRefId: fix.issueId,
          url: fix.url,
          issueType: fix.issueType,
          suggestedFix: fix.suggestedFix,
          status: "pending",
          generatedAt: now,
        })
        .run();
    }

    return fixes;
  });

  ipcMain.handle("ai:listSuggestedFixes", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(aiSuggestedFixes).where(eq(aiSuggestedFixes.projectId, projectId)).all();
  });

  ipcMain.handle(
    "ai:updateFixStatus",
    async (_event, fixId: string, status: "pending" | "applied" | "dismissed") => {
      const db = getDb();
      db.update(aiSuggestedFixes).set({ status }).where(eq(aiSuggestedFixes.id, fixId)).run();
      return { ok: true };
    }
  );
}
