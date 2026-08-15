import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { socialAccounts, socialPosts } from "../db/schema";
import { eq } from "drizzle-orm";

export function registerSocialHandlers() {
  ipcMain.handle("social:listAccounts", async (_event, projectId: string) => {
    const db = getDb();
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.projectId, projectId))
      .all();
  });

  ipcMain.handle(
    "social:schedulePost",
    async (_event, accountId: string, content: string, scheduledAt: string) => {
      const db = getDb();
      const post = {
        id: randomUUID(),
        socialAccountId: accountId,
        content,
        mediaPaths: null,
        scheduledAt,
        status: "scheduled",
      };
      db.insert(socialPosts).values(post).run();
      return post;
    }
  );
}
