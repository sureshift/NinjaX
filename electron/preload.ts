import { contextBridge, ipcRenderer } from "electron";

/**
 * The renderer never touches Node or the filesystem directly.
 * Every capability it needs is explicitly exposed here, one channel at a time.
 */
contextBridge.exposeInMainWorld("api", {
  seo: {
    // Technical
    runTechnicalAudit: (projectId: string, url: string) =>
      ipcRenderer.invoke("seo:runTechnicalAudit", projectId, url),
    checkRobotsAndSitemap: (domain: string) =>
      ipcRenderer.invoke("seo:checkRobotsAndSitemap", domain),
    listAudits: (projectId: string) => ipcRenderer.invoke("seo:listAudits", projectId),
    // On-page
    analyzeOnPage: (url: string, targetKeyword?: string) =>
      ipcRenderer.invoke("seo:analyzeOnPage", url, targetKeyword),
    // Performance
    measureCoreWebVitals: (projectId: string, url: string) =>
      ipcRenderer.invoke("seo:measureCoreWebVitals", projectId, url),
    // Site architecture
    crawlSite: (projectId: string, startUrl: string, maxPages?: number) =>
      ipcRenderer.invoke("seo:crawlSite", projectId, startUrl, maxPages),
    checkRedirectChain: (url: string) => ipcRenderer.invoke("seo:checkRedirectChain", url),
    listCrawlIssues: (projectId: string) => ipcRenderer.invoke("seo:listCrawlIssues", projectId),
    // Content
    runContentAudit: (projectId: string) => ipcRenderer.invoke("seo:runContentAudit", projectId),
    listContentAudits: (projectId: string) => ipcRenderer.invoke("seo:listContentAudits", projectId),
    // Keywords / rank tracking
    addKeyword: (projectId: string, keyword: string, targetUrl: string, searchEngine: string) =>
      ipcRenderer.invoke("seo:addKeyword", projectId, keyword, targetUrl, searchEngine),
    listKeywords: (projectId: string) => ipcRenderer.invoke("seo:listKeywords", projectId),
    clusterKeywords: (keywordList: string[]) => ipcRenderer.invoke("seo:clusterKeywords", keywordList),
    trackRank: (keywordId: string, keyword: string, domain: string, searchEngine: string) =>
      ipcRenderer.invoke("seo:trackRank", keywordId, keyword, domain, searchEngine),
    getRankHistory: (keywordId: string) => ipcRenderer.invoke("seo:getRankHistory", keywordId),
    // Off-page / backlinks
    fetchBacklinks: (projectId: string, domain: string) =>
      ipcRenderer.invoke("seo:fetchBacklinks", projectId, domain),
    listBacklinks: (projectId: string) => ipcRenderer.invoke("seo:listBacklinks", projectId),
    // Local SEO
    checkNapConsistency: (projectId: string, canonical: unknown, listings: unknown[]) =>
      ipcRenderer.invoke("seo:checkNapConsistency", projectId, canonical, listings),
    listLocalListings: (projectId: string) => ipcRenderer.invoke("seo:listLocalListings", projectId),
    // Competitor intelligence
    addCompetitor: (projectId: string, name: string, domain: string) =>
      ipcRenderer.invoke("seo:addCompetitor", projectId, name, domain),
    listCompetitors: (projectId: string) => ipcRenderer.invoke("seo:listCompetitors", projectId),
    fetchCompetitorBacklinks: (projectId: string, competitorId: string, domain: string) =>
      ipcRenderer.invoke("seo:fetchCompetitorBacklinks", projectId, competitorId, domain),
    getBacklinkGap: (projectId: string) => ipcRenderer.invoke("seo:getBacklinkGap", projectId),
    fetchCompetitorListings: (projectId: string, competitorId: string, businessName: string, platforms: string[]) =>
      ipcRenderer.invoke("seo:fetchCompetitorListings", projectId, competitorId, businessName, platforms),
    getLocalListingGap: (projectId: string) => ipcRenderer.invoke("seo:getLocalListingGap", projectId),
  },
  geo: {
    checkMentions: (projectId: string, query: string) =>
      ipcRenderer.invoke("geo:checkMentions", projectId, query),
  },
  aeo: {
    checkSnippet: (projectId: string, url: string, query: string) =>
      ipcRenderer.invoke("aeo:checkSnippet", projectId, url, query),
  },
  social: {
    listAccounts: (projectId: string) =>
      ipcRenderer.invoke("social:listAccounts", projectId),
    schedulePost: (accountId: string, content: string, scheduledAt: string) =>
      ipcRenderer.invoke("social:schedulePost", accountId, content, scheduledAt),
  },
  ai: {
    saveProviderConfig: (config: unknown) => ipcRenderer.invoke("ai:saveProviderConfig", config),
    getProviderConfig: () => ipcRenderer.invoke("ai:getProviderConfig"),
    generateContent: (projectId: string, request: unknown) =>
      ipcRenderer.invoke("ai:generateContent", projectId, request),
    listGeneratedContent: (projectId: string) => ipcRenderer.invoke("ai:listGeneratedContent", projectId),
    analyzeSite: (projectId: string) => ipcRenderer.invoke("ai:analyzeSite", projectId),
    generateReport: (projectId: string, projectName: string, domain: string) =>
      ipcRenderer.invoke("ai:generateReport", projectId, projectName, domain),
    listReports: (projectId: string) => ipcRenderer.invoke("ai:listReports", projectId),
    draftFixesForContentIssues: (projectId: string) =>
      ipcRenderer.invoke("ai:draftFixesForContentIssues", projectId),
    listSuggestedFixes: (projectId: string) => ipcRenderer.invoke("ai:listSuggestedFixes", projectId),
    updateFixStatus: (fixId: string, status: string) => ipcRenderer.invoke("ai:updateFixStatus", fixId, status),
  },
  google: {
    connect: (projectId: string, service: string, clientId: string, clientSecret: string, accountLabel?: string) =>
      ipcRenderer.invoke("google:connect", projectId, service, clientId, clientSecret, accountLabel),
    listConnections: (projectId: string) => ipcRenderer.invoke("google:listConnections", projectId),
    searchConsole: {
      listSites: (projectId: string) => ipcRenderer.invoke("google:searchConsole:listSites", projectId),
      sync: (projectId: string, siteUrl: string, startDate: string, endDate: string) =>
        ipcRenderer.invoke("google:searchConsole:sync", projectId, siteUrl, startDate, endDate),
      listMetrics: (projectId: string) => ipcRenderer.invoke("google:searchConsole:listMetrics", projectId),
    },
    analytics: {
      listProperties: (projectId: string) => ipcRenderer.invoke("google:analytics:listProperties", projectId),
      sync: (projectId: string, propertyId: string, startDate: string, endDate: string) =>
        ipcRenderer.invoke("google:analytics:sync", projectId, propertyId, startDate, endDate),
      listMetrics: (projectId: string) => ipcRenderer.invoke("google:analytics:listMetrics", projectId),
    },
    businessProfile: {
      listLocations: (projectId: string) => ipcRenderer.invoke("google:businessProfile:listLocations", projectId),
      syncReviews: (projectId: string, locationName: string) =>
        ipcRenderer.invoke("google:businessProfile:syncReviews", projectId, locationName),
      listReviews: (projectId: string) => ipcRenderer.invoke("google:businessProfile:listReviews", projectId),
      syncAsOwnListing: (projectId: string, locationName: string) =>
        ipcRenderer.invoke("google:businessProfile:syncAsOwnListing", projectId, locationName),
    },
  },
});
