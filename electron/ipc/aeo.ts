import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { aeoSnippets } from "../db/schema";

export function registerAeoHandlers() {
  ipcMain.handle(
    "aeo:checkSnippet",
    async (_event, projectId: string, url: string, query: string) => {
      const db = getDb();

      // TODO: replace with a real search-results check (SERP API or scraping).
      const record = {
        id: randomUUID(),
        projectId,
        url,
        query,
        hasFeaturedSnippet: false,
        checkedAt: new Date().toISOString(),
      };

      db.insert(aeoSnippets).values(record).run();
      return record;
    }
  );
}
