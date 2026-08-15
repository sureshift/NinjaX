export interface BacklinkRecord {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string | null;
  domainAuthority: number | null;
}

export interface BacklinkDataProvider {
  name: string;
  fetchBacklinks(domain: string): Promise<BacklinkRecord[]>;
}

/**
 * Building a real backlink index requires crawling a large chunk of the web -
 * that's what Ahrefs/Moz/Semrush do. NinjaX doesn't attempt to replicate that;
 * instead this is a pluggable provider. Implement BacklinkDataProvider against
 * whichever backlink API the user has a key for, and register it below.
 */
export class UnconfiguredBacklinkProvider implements BacklinkDataProvider {
  name = "unconfigured";
  async fetchBacklinks(): Promise<BacklinkRecord[]> {
    throw new Error(
      "No backlink data provider configured. Add an API key for Ahrefs/Moz/Semrush " +
        "in Settings and implement BacklinkDataProvider."
    );
  }
}

let activeProvider: BacklinkDataProvider = new UnconfiguredBacklinkProvider();

export function setBacklinkProvider(provider: BacklinkDataProvider) {
  activeProvider = provider;
}

export async function fetchBacklinksForDomain(domain: string): Promise<BacklinkRecord[]> {
  return activeProvider.fetchBacklinks(domain);
}

/** Anchor text distribution - flags over-optimization (too much exact-match anchor text). */
export function analyzeAnchorTextDistribution(backlinks: BacklinkRecord[]): {
  distribution: { anchorText: string; count: number; percentage: number }[];
  overOptimized: boolean;
} {
  const counts = new Map<string, number>();
  for (const link of backlinks) {
    const anchor = (link.anchorText || "(no anchor text)").trim().toLowerCase();
    counts.set(anchor, (counts.get(anchor) || 0) + 1);
  }

  const total = backlinks.length || 1;
  const distribution = Array.from(counts.entries())
    .map(([anchorText, count]) => ({ anchorText, count, percentage: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);

  const overOptimized = distribution.some((d) => d.anchorText !== "(no anchor text)" && d.percentage > 30);

  return { distribution, overOptimized };
}

/** Flags likely-toxic backlinks using simple heuristics on domain authority and anchor patterns. */
export function flagToxicBacklinks(backlinks: BacklinkRecord[]): BacklinkRecord[] {
  const spamAnchorPattern = /(viagra|casino|porn|loan|crypto giveaway)/i;
  return backlinks.filter(
    (link) =>
      (link.domainAuthority !== null && link.domainAuthority < 10) ||
      (link.anchorText && spamAnchorPattern.test(link.anchorText))
  );
}
