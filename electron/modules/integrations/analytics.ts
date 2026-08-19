import { OAuth2Client } from "google-auth-library";
import { google } from "./googleAuth";

export const ANALYTICS_SCOPES = ["https://www.googleapis.com/auth/analytics.readonly"];

export interface AnalyticsRow {
  date: string;
  sessions: number;
  activeUsers: number;
  screenPageViews: number;
  bounceRate: number;
  averageSessionDuration: number;
}

/**
 * Runs a GA4 report for the given property (format: "properties/123456789",
 * the GA4 Property ID, not the old Universal Analytics tracking ID).
 */
export async function fetchAnalyticsData(
  authClient: OAuth2Client,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsRow[]> {
  const analyticsData = google.analyticsdata({ version: "v1beta", auth: authClient });

  const response = await analyticsData.properties.runReport({
    property: propertyId,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "screenPageViews" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    },
  });

  return (response.data.rows ?? []).map((row) => ({
    date: row.dimensionValues?.[0]?.value ?? "",
    sessions: Number(row.metricValues?.[0]?.value ?? 0),
    activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
    screenPageViews: Number(row.metricValues?.[2]?.value ?? 0),
    bounceRate: Number(row.metricValues?.[3]?.value ?? 0),
    averageSessionDuration: Number(row.metricValues?.[4]?.value ?? 0),
  }));
}

/** Lists GA4 properties accessible to the authenticated account, across all accounts. */
export async function listAnalyticsProperties(
  authClient: OAuth2Client
): Promise<{ propertyId: string; displayName: string }[]> {
  const admin = google.analyticsadmin({ version: "v1beta", auth: authClient });
  const accounts = await admin.accounts.list();

  const properties: { propertyId: string; displayName: string }[] = [];
  for (const account of accounts.data.accounts ?? []) {
    const propsResponse = await admin.properties.list({ filter: `parent:${account.name}` });
    for (const property of propsResponse.data.properties ?? []) {
      properties.push({ propertyId: property.name ?? "", displayName: property.displayName ?? "" });
    }
  }
  return properties;
}
