export interface SeoAudit {
  id: string;
  projectId: string;
  url: string;
  score: number;
  issuesJson: string;
  crawledAt: string;
}

interface NinjaXApi {
  seo: {
    runTechnicalAudit: (projectId: string, url: string) => Promise<{ audit: SeoAudit; details: unknown }>;
    checkRobotsAndSitemap: (domain: string) => Promise<unknown>;
    listAudits: (projectId: string) => Promise<SeoAudit[]>;
    analyzeOnPage: (url: string, targetKeyword?: string) => Promise<unknown>;
    measureCoreWebVitals: (projectId: string, url: string) => Promise<unknown>;
    crawlSite: (projectId: string, startUrl: string, maxPages?: number) => Promise<unknown>;
    checkRedirectChain: (url: string) => Promise<string[]>;
    listCrawlIssues: (projectId: string) => Promise<unknown[]>;
    runContentAudit: (projectId: string) => Promise<unknown[]>;
    listContentAudits: (projectId: string) => Promise<unknown[]>;
    addKeyword: (projectId: string, keyword: string, targetUrl: string, searchEngine: string) => Promise<unknown>;
    listKeywords: (projectId: string) => Promise<unknown[]>;
    clusterKeywords: (keywordList: string[]) => Promise<[string, string[]][]>;
    trackRank: (keywordId: string, keyword: string, domain: string, searchEngine: string) => Promise<unknown>;
    getRankHistory: (keywordId: string) => Promise<unknown[]>;
    fetchBacklinks: (projectId: string, domain: string) => Promise<unknown>;
    listBacklinks: (projectId: string) => Promise<unknown[]>;
    checkNapConsistency: (projectId: string, canonical: unknown, listings: unknown[]) => Promise<unknown>;
    listLocalListings: (projectId: string) => Promise<unknown[]>;
    addCompetitor: (projectId: string, name: string, domain: string) => Promise<unknown>;
    listCompetitors: (projectId: string) => Promise<unknown[]>;
    fetchCompetitorBacklinks: (projectId: string, competitorId: string, domain: string) => Promise<unknown[]>;
    getBacklinkGap: (projectId: string) => Promise<unknown[]>;
    fetchCompetitorListings: (projectId: string, competitorId: string, businessName: string, platforms: string[]) => Promise<unknown[]>;
    getLocalListingGap: (projectId: string) => Promise<unknown[]>;
  };
  geo: {
    checkMentions: (projectId: string, query: string) => Promise<unknown>;
  };
  aeo: {
    checkSnippet: (projectId: string, url: string, query: string) => Promise<unknown>;
  };
  social: {
    listAccounts: (projectId: string) => Promise<unknown[]>;
    schedulePost: (accountId: string, content: string, scheduledAt: string) => Promise<unknown>;
  };
  ai: {
    saveProviderConfig: (config: unknown) => Promise<unknown>;
    getProviderConfig: () => Promise<unknown>;
    generateContent: (projectId: string, request: unknown) => Promise<unknown>;
    listGeneratedContent: (projectId: string) => Promise<unknown[]>;
    analyzeSite: (projectId: string) => Promise<string>;
    generateReport: (projectId: string, projectName: string, domain: string) => Promise<unknown>;
    listReports: (projectId: string) => Promise<unknown[]>;
    draftFixesForContentIssues: (projectId: string) => Promise<unknown[]>;
    listSuggestedFixes: (projectId: string) => Promise<unknown[]>;
    updateFixStatus: (fixId: string, status: string) => Promise<unknown>;
  };
  google: {
    connect: (projectId: string, service: string, clientId: string, clientSecret: string, accountLabel?: string) => Promise<unknown>;
    listConnections: (projectId: string) => Promise<unknown[]>;
    searchConsole: {
      listSites: (projectId: string) => Promise<string[]>;
      sync: (projectId: string, siteUrl: string, startDate: string, endDate: string) => Promise<unknown>;
      listMetrics: (projectId: string) => Promise<unknown[]>;
    };
    analytics: {
      listProperties: (projectId: string) => Promise<unknown[]>;
      sync: (projectId: string, propertyId: string, startDate: string, endDate: string) => Promise<unknown>;
      listMetrics: (projectId: string) => Promise<unknown[]>;
    };
    businessProfile: {
      listLocations: (projectId: string) => Promise<unknown[]>;
      syncReviews: (projectId: string, locationName: string) => Promise<unknown>;
      listReviews: (projectId: string) => Promise<unknown[]>;
      syncAsOwnListing: (projectId: string, locationName: string) => Promise<unknown>;
    };
  };
}

declare global {
  interface Window {
    api: NinjaXApi;
  }
}

export const api = () => window.api;
