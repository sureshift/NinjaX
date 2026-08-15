import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Opens (or creates) ninjax.db inside the OS-appropriate app data folder,
 * e.g. %APPDATA%/NinjaX on Windows. This is the ONE file that holds all
 * user data - projects, audits, keywords, social accounts, everything.
 */
export function getDb() {
  if (dbInstance) return dbInstance;

  const userDataPath = app.getPath("userData");
  if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });

  const dbPath = path.join(userDataPath, "ninjax.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");

  dbInstance = drizzle(sqlite, { schema });

  createTablesIfMissing(sqlite);

  return dbInstance;
}

function createTablesIfMissing(sqlite: Database.Database) {
  // Minimal bootstrap for the MVP. Once the schema stabilizes, replace this
  // with generated Drizzle Kit migrations checked into electron/db/migrations.
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, domain TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS seo_audits (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, url TEXT NOT NULL,
      score INTEGER, issues_json TEXT, crawled_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, keyword TEXT NOT NULL,
      target_url TEXT, search_engine TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rank_history (
      id TEXT PRIMARY KEY, keyword_id TEXT NOT NULL, position INTEGER, checked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS geo_checks (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, query TEXT NOT NULL,
      engine TEXT NOT NULL, mentioned INTEGER, snippet TEXT, checked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS aeo_snippets (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, url TEXT NOT NULL, query TEXT NOT NULL,
      has_featured_snippet INTEGER, checked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS social_accounts (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, platform TEXT NOT NULL,
      handle TEXT NOT NULL, oauth_token_encrypted TEXT
    );
    CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY, social_account_id TEXT NOT NULL, content TEXT NOT NULL,
      media_paths TEXT, scheduled_at TEXT, status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS post_metrics (
      id TEXT PRIMARY KEY, social_post_id TEXT NOT NULL, likes INTEGER, shares INTEGER,
      comments INTEGER, impressions INTEGER, pulled_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT
    );
  `);
}
