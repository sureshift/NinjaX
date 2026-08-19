import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db/client";
import { googleConnections, searchConsoleMetrics, analyticsMetrics, gbpReviews, localListings } from "../db/schema";
import { encryptSecret, decryptSecret } from "../services/secureStorage";
import { runGoogleOAuthFlow, buildAuthedClient, GoogleOAuthConfig, GoogleTokens } from "../modules/integrations/googleAuth";
import { SEARCH_CONSOLE_SCOPES, fetchSearchConsoleData, listSearchConsoleSites } from "../modules/integrations/searchConsole";
import { ANALYTICS_SCOPES, fetchAnalyticsData, listAnalyticsProperties } from "../modules/integrations/analytics";
import { BUSINESS_PROFILE_SCOPES, listGbpLocations, fetchGbpReviews } from "../modules/integrations/businessProfile";

type GoogleService = "search_console" | "analytics" | "business_profile";

const SCOPES_BY_SERVICE: Record<GoogleService, string[]> = {
  search_console: SEARCH_CONSOLE_SCOPES,
  analytics: ANALYTICS_SCOPES,
  business_profile: BUSINESS_PROFILE_SCOPES,
};

export function registerGoogleHandlers() {
  /**
   * Connects a Google service. The user supplies their own OAuth Client
   * ID/Secret (created in Google Cloud Console) - NinjaX doesn't ship a
   * shared one. Tokens are encrypted at rest via safeStorage before saving.
   */
  ipcMain.handle(
    "google:connect",
    async (
      _event,
      projectId: string,
      service: GoogleService,
      clientId: string,
      clientSecret: string,
      accountLabel?: string
    ) => {
      const db = getDb();
      const config: GoogleOAuthConfig = { clientId, clientSecret, scopes: SCOPES_BY_SERVICE[service] };
      const tokens = await runGoogleOAuthFlow(config);

      const record = {
        id: randomUUID(),
        projectId,
        service,
        accountLabel: accountLabel ?? null,
        accessTokenEncrypted: encryptSecret(tokens.accessToken),
        refreshTokenEncrypted: encryptSecret(tokens.refreshToken),
        expiryDate: tokens.expiryDate,
        connectedAt: new Date().toISOString(),
      };
      db.insert(googleConnections).values(record).run();

      // Client ID/secret are needed again for token refresh - store alongside,
      // encrypted, rather than re-prompting the user every session.
      db.insert(googleConnections)
        .values({ ...record, id: `${record.id}-config`, service: `${service}_config`, accessTokenEncrypted: encryptSecret(clientId), refreshTokenEncrypted: encryptSecret(clientSecret) })
        .run();

      return { id: record.id, service, accountLabel: record.accountLabel };
    }
  );

  ipcMain.handle("google:listConnections", async (_event, projectId: string) => {
    const db = getDb();
    return db
      .select()
      .from(googleConnections)
      .where(eq(googleConnections.projectId, projectId))
      .all()
      .filter((c) => !c.service.endsWith("_config"))
      .map((c) => ({ id: c.id, service: c.service, accountLabel: c.accountLabel, connectedAt: c.connectedAt }));
  });

  // ---------- Search Console ----------
  ipcMain.handle("google:searchConsole:listSites", async (_event, projectId: string) => {
    const client = await getAuthedClient(projectId, "search_console");
    return listSearchConsoleSites(client);
  });

  ipcMain.handle(
    "google:searchConsole:sync",
    async (_event, projectId: string, siteUrl: string, startDate: string, endDate: string) => {
      const db = getDb();
      const client = await getAuthedClient(projectId, "search_console");
      const rows = await fetchSearchConsoleData(client, siteUrl, startDate, endDate);

      for (const row of rows) {
        db.insert(searchConsoleMetrics)
          .values({
            id: randomUUID(),
            projectId,
            query: row.query,
            page: row.page,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
            date: row.date,
          })
          .run();
      }
      return { synced: rows.length };
    }
  );

  ipcMain.handle("google:searchConsole:listMetrics", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(searchConsoleMetrics).where(eq(searchConsoleMetrics.projectId, projectId)).all();
  });

  // ---------- Analytics (GA4) ----------
  ipcMain.handle("google:analytics:listProperties", async (_event, projectId: string) => {
    const client = await getAuthedClient(projectId, "analytics");
    return listAnalyticsProperties(client);
  });

  ipcMain.handle(
    "google:analytics:sync",
    async (_event, projectId: string, propertyId: string, startDate: string, endDate: string) => {
      const db = getDb();
      const client = await getAuthedClient(projectId, "analytics");
      const rows = await fetchAnalyticsData(client, propertyId, startDate, endDate);

      for (const row of rows) {
        db.insert(analyticsMetrics)
          .values({
            id: randomUUID(),
            projectId,
            date: row.date,
            sessions: row.sessions,
            activeUsers: row.activeUsers,
            pageViews: row.screenPageViews,
            bounceRate: row.bounceRate,
            avgSessionDuration: row.averageSessionDuration,
          })
          .run();
      }
      return { synced: rows.length };
    }
  );

  ipcMain.handle("google:analytics:listMetrics", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(analyticsMetrics).where(eq(analyticsMetrics.projectId, projectId)).all();
  });

  // ---------- Business Profile ----------
  ipcMain.handle("google:businessProfile:listLocations", async (_event, projectId: string) => {
    const client = await getAuthedClient(projectId, "business_profile");
    return listGbpLocations(client);
  });

  ipcMain.handle("google:businessProfile:syncReviews", async (_event, projectId: string, locationName: string) => {
    const db = getDb();
    const client = await getAuthedClient(projectId, "business_profile");
    const reviews = await fetchGbpReviews(client, locationName);

    for (const review of reviews) {
      db.insert(gbpReviews)
        .values({
          id: randomUUID(),
          projectId,
          reviewId: review.reviewId,
          reviewerName: review.reviewerName,
          starRating: review.starRating,
          comment: review.comment,
          createTime: review.createTime,
        })
        .run();
    }
    return { synced: reviews.length };
  });

  ipcMain.handle("google:businessProfile:listReviews", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(gbpReviews).where(eq(gbpReviews.projectId, projectId)).all();
  });

  /**
   * Pulls the connected GBP location's NAP data straight into the local SEO
   * module's own listings table (competitorId null = the project's own
   * listing), so it shows up in NAP consistency checks alongside manual entries.
   */
  ipcMain.handle("google:businessProfile:syncAsOwnListing", async (_event, projectId: string, locationName: string) => {
    const db = getDb();
    const client = await getAuthedClient(projectId, "business_profile");
    const locations = await listGbpLocations(client);
    const match = locations.find((l) => l.name === locationName);
    if (!match) throw new Error("Location not found for this connection");

    const record = {
      id: randomUUID(),
      projectId,
      competitorId: null,
      platform: "google-business-profile",
      businessName: match.title,
      address: match.address,
      phone: match.phone,
      napConsistent: null,
      checkedAt: new Date().toISOString(),
    };
    db.insert(localListings).values(record).run();
    return record;
  });
}

async function getAuthedClient(projectId: string, service: GoogleService) {
  const db = getDb();
  const connection = db
    .select()
    .from(googleConnections)
    .where(and(eq(googleConnections.projectId, projectId), eq(googleConnections.service, service)))
    .get();
  if (!connection) throw new Error(`No ${service} connection found for this project. Connect it in Settings first.`);

  const configRow = db
    .select()
    .from(googleConnections)
    .where(and(eq(googleConnections.projectId, projectId), eq(googleConnections.service, `${service}_config`)))
    .get();
  if (!configRow) throw new Error(`Missing stored OAuth client config for ${service}.`);

  const config: GoogleOAuthConfig = {
    clientId: decryptSecret(configRow.accessTokenEncrypted),
    clientSecret: decryptSecret(configRow.refreshTokenEncrypted),
    scopes: SCOPES_BY_SERVICE[service],
  };
  const tokens: GoogleTokens = {
    accessToken: decryptSecret(connection.accessTokenEncrypted),
    refreshToken: decryptSecret(connection.refreshTokenEncrypted),
    expiryDate: connection.expiryDate,
  };

  return buildAuthedClient(config, tokens);
}
