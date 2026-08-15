import { contextBridge, ipcRenderer } from "electron";

/**
 * The renderer never touches Node or the filesystem directly.
 * Every capability it needs is explicitly exposed here, one channel at a time.
 */
contextBridge.exposeInMainWorld("api", {
  seo: {
    runAudit: (projectId: string, url: string) =>
      ipcRenderer.invoke("seo:runAudit", projectId, url),
    listAudits: (projectId: string) =>
      ipcRenderer.invoke("seo:listAudits", projectId),
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
});
