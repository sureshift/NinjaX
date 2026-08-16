import { BacklinkRecord, fetchBacklinksForDomain } from "./backlinks";
import { Listing } from "./local";

export interface Competitor {
  id: string;
  projectId: string;
  name: string;
  domain: string;
}

/**
 * Fetches backlinks for a competitor's domain using the same pluggable
 * provider as electron/modules/seo/backlinks.ts (Ahrefs/Moz/Semrush, etc.).
 * This is standard competitive research - the same kind of publicly
 * available backlink-index data every major SEO tool surfaces.
 */
export async function fetchCompetitorBacklinks(domain: string): Promise<BacklinkRecord[]> {
  return fetchBacklinksForDomain(domain);
}

export interface BacklinkGapEntry {
  sourceUrl: string;
  domainAuthority: number | null;
  linksToCompetitors: string[]; // competitor domains this source links to
}

/**
 * "Link Intersect": finds domains that link to one or more competitors but
 * do NOT currently link to the user's own site - i.e. real link-building
 * opportunities, ranked by domain authority.
 */
export function findBacklinkGap(
  ownBacklinks: BacklinkRecord[],
  competitorBacklinksByDomain: Map<string, BacklinkRecord[]>
): BacklinkGapEntry[] {
  const ownSources = new Set(ownBacklinks.map((b) => normalizeHost(b.sourceUrl)));
  const gapMap = new Map<string, BacklinkGapEntry>();

  for (const [competitorDomain, links] of competitorBacklinksByDomain.entries()) {
    for (const link of links) {
      const host = normalizeHost(link.sourceUrl);
      if (ownSources.has(host)) continue; // already links to us too - not a gap

      if (!gapMap.has(host)) {
        gapMap.set(host, { sourceUrl: link.sourceUrl, domainAuthority: link.domainAuthority, linksToCompetitors: [] });
      }
      const entry = gapMap.get(host)!;
      if (!entry.linksToCompetitors.includes(competitorDomain)) entry.linksToCompetitors.push(competitorDomain);
      if (link.domainAuthority !== null) {
        entry.domainAuthority = Math.max(entry.domainAuthority ?? 0, link.domainAuthority);
      }
    }
  }

  return Array.from(gapMap.values()).sort(
    (a, b) => (b.domainAuthority ?? 0) - (a.domainAuthority ?? 0) || b.linksToCompetitors.length - a.linksToCompetitors.length
  );
}

export interface LocalListingGapEntry {
  platform: string;
  competitorsPresent: string[]; // competitor names listed on this platform
  ownListingFound: boolean;
}

/**
 * Compares which local-directory platforms competitors are listed on
 * against the user's own listings, surfacing directories worth claiming.
 */
export function findLocalListingGap(
  ownListings: Listing[],
  competitorListingsByName: Map<string, Listing[]>
): LocalListingGapEntry[] {
  const ownPlatforms = new Set(ownListings.map((l) => l.platform.toLowerCase()));
  const gapMap = new Map<string, LocalListingGapEntry>();

  for (const [competitorName, listings] of competitorListingsByName.entries()) {
    for (const listing of listings) {
      const platform = listing.platform.toLowerCase();
      if (!gapMap.has(platform)) {
        gapMap.set(platform, { platform: listing.platform, competitorsPresent: [], ownListingFound: ownPlatforms.has(platform) });
      }
      const entry = gapMap.get(platform)!;
      if (!entry.competitorsPresent.includes(competitorName)) entry.competitorsPresent.push(competitorName);
    }
  }

  return Array.from(gapMap.values())
    .filter((entry) => !entry.ownListingFound)
    .sort((a, b) => b.competitorsPresent.length - a.competitorsPresent.length);
}

function normalizeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
