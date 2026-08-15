export interface RankCheckProvider {
  name: string;
  /** Returns the SERP position (1-based) for keyword/domain, or null if not found in results checked. */
  checkRank(keyword: string, domain: string, searchEngine: string): Promise<number | null>;
}

/**
 * No rank-check provider is wired up by default. Scraping Google/Bing SERPs
 * directly violates their Terms of Service, so NinjaX does not do that.
 * Instead, plug in a licensed rank-tracking API (e.g. SerpApi, DataForSEO,
 * Semrush) here - implement RankCheckProvider and register it below.
 */
export class UnconfiguredRankProvider implements RankCheckProvider {
  name = "unconfigured";
  async checkRank(): Promise<number | null> {
    throw new Error(
      "No rank-check provider configured. Add an API key for SerpApi/DataForSEO/Semrush " +
        "in Settings and implement RankCheckProvider, then register it in scheduler.ts."
    );
  }
}

let activeProvider: RankCheckProvider = new UnconfiguredRankProvider();

export function setRankCheckProvider(provider: RankCheckProvider) {
  activeProvider = provider;
}

export async function trackKeywordRank(keyword: string, domain: string, searchEngine: string) {
  const position = await activeProvider.checkRank(keyword, domain, searchEngine);
  return { position, checkedAt: new Date().toISOString(), provider: activeProvider.name };
}

/**
 * Groups a flat keyword list into topic clusters using simple shared-token
 * overlap. Good enough for a first pass; swap for embeddings-based clustering
 * later if needed.
 */
export function clusterKeywords(keywords: string[]): Map<string, string[]> {
  const clusters = new Map<string, string[]>();

  for (const keyword of keywords) {
    const tokens = keyword.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const primaryToken = tokens.sort((a, b) => b.length - a.length)[0] ?? keyword;

    if (!clusters.has(primaryToken)) clusters.set(primaryToken, []);
    clusters.get(primaryToken)!.push(keyword);
  }

  return clusters;
}
