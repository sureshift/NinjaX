import { askAi } from "./provider";

export interface RemediableIssue {
  id: string;
  url: string;
  issueType: string;
  details: string;
}

export interface SuggestedFix {
  issueId: string;
  url: string;
  issueType: string;
  suggestedFix: string;
}

const SYSTEM_PROMPT =
  "You are an SEO engineer. Given a specific site issue, produce the exact fix - actual replacement " +
  "text (title, meta description, alt text, etc.) or precise technical instructions. No preamble, " +
  "just the usable fix.";

/**
 * Drafts a concrete fix for a single issue. NinjaX does not push changes to
 * a live site or CMS on its own - this generates a ready-to-use fix that
 * the user reviews and applies (or later, that a CMS connector applies for
 * them once one exists). Auto-editing a live production site without human
 * review is a good way to break something, so that step stays manual by design.
 */
export async function draftFix(issue: RemediableIssue): Promise<SuggestedFix> {
  const suggestedFix = await askAi([
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Page: ${issue.url}\nIssue type: ${issue.issueType}\nDetails: ${issue.details}\n\nProvide the fix.`,
    },
  ]);

  return { issueId: issue.id, url: issue.url, issueType: issue.issueType, suggestedFix };
}

/** Drafts fixes for a batch of issues sequentially (keeps AI provider rate limits sane). */
export async function draftFixesForIssues(issues: RemediableIssue[]): Promise<SuggestedFix[]> {
  const results: SuggestedFix[] = [];
  for (const issue of issues) {
    results.push(await draftFix(issue));
  }
  return results;
}
