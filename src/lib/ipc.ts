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
}

declare global {
  interface Window {
    api: NinjaXApi;
  }
}

export const api = () => window.api;
