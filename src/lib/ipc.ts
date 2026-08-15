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
    runAudit: (projectId: string, url: string) => Promise<SeoAudit>;
    listAudits: (projectId: string) => Promise<SeoAudit[]>;
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
