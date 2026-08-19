import { askAi } from "./provider";

export interface ReportData {
  projectName: string;
  domain: string;
  auditScoreAvg: number | null;
  totalPagesCrawled: number;
  totalIssues: number;
  topIssues: string[];
  keywordCount: number;
  backlinkCount: number;
  competitorCount: number;
}

const SYSTEM_PROMPT =
  "You write clear, client-ready SEO reports. Structure output in Markdown with headings: " +
  "Executive Summary, Key Findings, Recommended Actions, Next Steps. Keep it professional and concise.";

export async function generateSeoReport(data: ReportData): Promise<string> {
  const brief = [
    `Project: ${data.projectName} (${data.domain})`,
    `Average technical audit score: ${data.auditScoreAvg ?? "N/A"}/100`,
    `Pages crawled: ${data.totalPagesCrawled}`,
    `Total open issues: ${data.totalIssues}`,
    `Top issues: ${data.topIssues.join("; ") || "none"}`,
    `Keywords tracked: ${data.keywordCount}`,
    `Backlinks tracked: ${data.backlinkCount}`,
    `Competitors tracked: ${data.competitorCount}`,
  ].join("\n");

  return askAi([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Write a full SEO report from this data:\n\n${brief}` },
  ]);
}
