import { askAi } from "./provider";

export interface AnalysisInput {
  technicalIssues: string[];
  contentIssues: { url: string; issueType: string; details: string }[];
  crawlIssues: { url: string; issueType: string; details: string }[];
  keywordCount: number;
  backlinkCount: number;
  toxicBacklinkCount: number;
}

const SYSTEM_PROMPT =
  "You are a senior SEO consultant. Given raw audit data, produce a prioritized, actionable " +
  "analysis: what to fix first and why, grouped by impact (high/medium/low). Be specific and concise.";

export async function analyzeSite(input: AnalysisInput): Promise<string> {
  const summary = [
    `Technical issues (${input.technicalIssues.length}): ${input.technicalIssues.join("; ") || "none"}`,
    `Content issues (${input.contentIssues.length}): ${input.contentIssues
      .map((i) => `${i.url} - ${i.issueType}: ${i.details}`)
      .join("; ") || "none"}`,
    `Site crawl issues (${input.crawlIssues.length}): ${input.crawlIssues
      .map((i) => `${i.url} - ${i.issueType}: ${i.details}`)
      .join("; ") || "none"}`,
    `Keywords tracked: ${input.keywordCount}`,
    `Backlinks: ${input.backlinkCount} (${input.toxicBacklinkCount} flagged as potentially toxic)`,
  ].join("\n\n");

  return askAi([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Analyze this SEO audit data and prioritize fixes:\n\n${summary}` },
  ]);
}
