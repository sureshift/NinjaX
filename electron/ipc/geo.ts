import { ipcMain } from "electron";
import { randomUUID } from "crypto";
import { getDb } from "../db/client";
import { geoChecks } from "../db/schema";

export function registerGeoHandlers() {
  ipcMain.handle("geo:checkMentions", async (_event, projectId: string, query: string) => {
    const db = getDb();

    // TODO: wire up a real connector (OpenAI/Anthropic/Perplexity API) via
    // electron/services/connectors. Stubbed for scaffold purposes.
    const record = {
      id: randomUUID(),
      projectId,
      query,
      engine: "stub",
      mentioned: false,
      snippet: null,
      checkedAt: new Date().toISOString(),
    };

    db.insert(geoChecks).values(record).run();
    return record;
  });
}
