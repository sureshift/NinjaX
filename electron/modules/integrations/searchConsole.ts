import { OAuth2Client } from "google-auth-library";
import { google } from "./googleAuth";

export const SEARCH_CONSOLE_SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

export interface SearchConsoleRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  date: string;
}

/**
 * Pulls query/page-level performance for a verified property over a date
 * range. siteUrl must match exactly what's verified in Search Console
 * (e.g. "https://example.com/" or "sc-domain:example.com").
 */
export async function fetchSearchConsoleData(
  authClient: OAuth2Client,
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<SearchConsoleRow[]> {
  const searchConsole = google.searchconsole({ version: "v1", auth: authClient });

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["query", "page", "date"],
      rowLimit: 5000,
    },
  });

  return (response.data.rows ?? []).map((row) => ({
    query: row.keys?.[0] ?? "",
    page: row.keys?.[1] ?? "",
    date: row.keys?.[2] ?? "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));
}

/** Lists the Search Console properties the authenticated Google account has access to. */
export async function listSearchConsoleSites(authClient: OAuth2Client): Promise<string[]> {
  const searchConsole = google.searchconsole({ version: "v1", auth: authClient });
  const response = await searchConsole.sites.list();
  return (response.data.siteEntry ?? []).map((s) => s.siteUrl ?? "").filter(Boolean);
}
