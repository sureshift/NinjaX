import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { seoAudits } from "../db/schema";
import { eq } from "drizzle-orm";
import { crawlPage } from "../services/crawler";

export function registerSeoHandlers() {
  ipcMain.handle("seo:runAudit", async (_event, projectId: string, url: string) => {
    const db = getDb();
    const result = await crawlPage(url);

    const audit = {
      id: randomUUID(),
      projectId,
      url,
      score: result.score,
      issuesJson: JSON.stringify(result.issues),
      crawledAt: new Date().toISOString(),
    };

    db.insert(seoAudits).values(audit).run();
    return audit;
  });

  ipcMain.handle("seo:listAudits", async (_event, projectId: string) => {
    const db = getDb();
    return db.select().from(seoAudits).where(eq(seoAudits.projectId, projectId)).all();
  });
}
