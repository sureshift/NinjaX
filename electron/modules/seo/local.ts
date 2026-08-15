export interface Listing {
  platform: string;
  businessName: string;
  address: string;
  phone: string;
}

export interface NapConsistencyResult {
  listing: Listing;
  isConsistent: boolean;
  mismatches: string[];
}

/**
 * Compares every listing's Name/Address/Phone against a canonical source of
 * truth (typically the business's own site or Google Business Profile) and
 * flags mismatches - the biggest driver of local ranking issues.
 */
export function checkNapConsistency(canonical: Listing, listings: Listing[]): NapConsistencyResult[] {
  return listings.map((listing) => {
    const mismatches: string[] = [];

    if (normalize(listing.businessName) !== normalize(canonical.businessName)) {
      mismatches.push(`Business name mismatch: "${listing.businessName}" vs "${canonical.businessName}"`);
    }
    if (normalize(listing.address) !== normalize(canonical.address)) {
      mismatches.push(`Address mismatch: "${listing.address}" vs "${canonical.address}"`);
    }
    if (normalizePhone(listing.phone) !== normalizePhone(canonical.phone)) {
      mismatches.push(`Phone mismatch: "${listing.phone}" vs "${canonical.phone}"`);
    }

    return { listing, isConsistent: mismatches.length === 0, mismatches };
  });
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * Google Business Profile has an official API for pulling/verifying listing
 * data automatically. Not wired up by default - implement here once the
 * user connects a Google account (OAuth), reusing the same connector pattern
 * as electron/modules/seo/keywords.ts and backlinks.ts.
 */
export interface LocalListingProvider {
  name: string;
  fetchListing(platform: string, businessName: string): Promise<Listing | null>;
}
