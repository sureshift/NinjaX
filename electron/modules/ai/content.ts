import { askAi } from "./provider";

export interface ContentRequest {
  topic: string;
  targetKeyword?: string;
  tone?: string;
  contentType: "blog_post" | "meta_description" | "title_tag" | "product_description" | "faq_answer";
  wordCount?: number;
}

const SYSTEM_PROMPT =
  "You are an SEO content writer. Write clear, accurate, well-structured content optimized " +
  "for search engines without keyword stuffing. Match the requested content type and length exactly.";

export async function generateContent(request: ContentRequest): Promise<string> {
  const lengthHint =
    request.contentType === "meta_description"
      ? "under 160 characters"
      : request.contentType === "title_tag"
      ? "under 60 characters"
      : request.wordCount
      ? `approximately ${request.wordCount} words`
      : "an appropriate length for the content type";

  const userPrompt = [
    `Content type: ${request.contentType}`,
    `Topic: ${request.topic}`,
    request.targetKeyword ? `Target keyword to naturally include: ${request.targetKeyword}` : null,
    request.tone ? `Tone: ${request.tone}` : null,
    `Length: ${lengthHint}`,
    "Return only the content itself, no preamble or explanation.",
  ]
    .filter(Boolean)
    .join("\n");

  return askAi([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]);
}
