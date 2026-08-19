import { OAuth2Client } from "google-auth-library";
import { google } from "./googleAuth";
import { LocalListingProvider } from "../seo/local";

export const BUSINESS_PROFILE_SCOPES = ["https://www.googleapis.com/auth/business.manage"];

export interface GbpLocation {
  name: string; // resource name, e.g. "accounts/123/locations/456"
  title: string;
  address: string;
  phone: string | null;
  websiteUri: string | null;
}

export interface GbpReview {
  reviewId: string;
  reviewerName: string;
  starRating: number;
  comment: string | null;
  createTime: string;
}

/** Lists the business locations the authenticated account manages. */
export async function listGbpLocations(authClient: OAuth2Client): Promise<GbpLocation[]> {
  const accountMgmt = google.mybusinessaccountmanagement({ version: "v1", auth: authClient });
  const accounts = await accountMgmt.accounts.list();

  const businessInfo = google.mybusinessbusinessinformation({ version: "v1", auth: authClient });
  const locations: GbpLocation[] = [];

  for (const account of accounts.data.accounts ?? []) {
    const response = await businessInfo.accounts.locations.list({
      parent: account.name ?? "",
      readMask: "title,phoneNumbers,websiteUri,storefrontAddress",
    });

    for (const location of response.data.locations ?? []) {
      locations.push({
        name: location.name ?? "",
        title: location.title ?? "",
        address: (location.storefrontAddress?.addressLines ?? []).join(", "),
        phone: location.phoneNumbers?.primaryPhone ?? null,
        websiteUri: location.websiteUri ?? null,
      });
    }
  }

  return locations;
}

/** Fetches reviews for a given GBP location. */
export async function fetchGbpReviews(authClient: OAuth2Client, locationName: string): Promise<GbpReview[]> {
  // Google split reviews out of the deprecated v4 My Business API into a
  // dedicated REST surface (mybusinessreviews.googleapis.com) that isn't
  // wrapped by the googleapis SDK yet - call it directly via the authed client.
  const response = await authClient.request<{
    reviews?: {
      reviewId?: string;
      reviewer?: { displayName?: string };
      starRating?: string;
      comment?: string;
      createTime?: string;
    }[];
  }>({
    url: `https://mybusinessreviews.googleapis.com/v1/${locationName}/reviews`,
    method: "GET",
  });

  return (response.data.reviews ?? []).map((review) => ({
    reviewId: review.reviewId ?? "",
    reviewerName: review.reviewer?.displayName ?? "Anonymous",
    starRating: starRatingToNumber(review.starRating),
    comment: review.comment ?? null,
    createTime: review.createTime ?? "",
  }));
}

function starRatingToNumber(rating: string | null | undefined): number {
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return rating ? map[rating] ?? 0 : 0;
}

/**
 * Implements LocalListingProvider (electron/modules/seo/local.ts) so Google
 * Business Profile data can feed the NAP-consistency and competitor
 * local-listing-gap features directly, alongside manually-entered listings.
 */
export function createGbpListingProvider(authClient: OAuth2Client): LocalListingProvider {
  return {
    name: "google-business-profile",
    async fetchListing(_platform: string, businessName: string) {
      const locations = await listGbpLocations(authClient);
      const match = locations.find((l) => l.title.toLowerCase() === businessName.toLowerCase());
      if (!match) return null;
      return {
        platform: "google-business-profile",
        businessName: match.title,
        address: match.address,
        phone: match.phone ?? "",
      };
    },
  };
}
