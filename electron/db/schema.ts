import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  createdAt: text("created_at").notNull(),
});

export const seoAudits = sqliteTable("seo_audits", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  score: integer("score"),
  issuesJson: text("issues_json"),
  crawledAt: text("crawled_at").notNull(),
});

export const keywords = sqliteTable("keywords", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  keyword: text("keyword").notNull(),
  targetUrl: text("target_url"),
  searchEngine: text("search_engine").notNull(),
});

export const rankHistory = sqliteTable("rank_history", {
  id: text("id").primaryKey(),
  keywordId: text("keyword_id").notNull(),
  position: integer("position"),
  checkedAt: text("checked_at").notNull(),
});

export const geoChecks = sqliteTable("geo_checks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  query: text("query").notNull(),
  engine: text("engine").notNull(),
  mentioned: integer("mentioned", { mode: "boolean" }),
  snippet: text("snippet"),
  checkedAt: text("checked_at").notNull(),
});

export const aeoSnippets = sqliteTable("aeo_snippets", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  query: text("query").notNull(),
  hasFeaturedSnippet: integer("has_featured_snippet", { mode: "boolean" }),
  checkedAt: text("checked_at").notNull(),
});

export const socialAccounts = sqliteTable("social_accounts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  oauthTokenEncrypted: text("oauth_token_encrypted"),
});

export const socialPosts = sqliteTable("social_posts", {
  id: text("id").primaryKey(),
  socialAccountId: text("social_account_id").notNull(),
  content: text("content").notNull(),
  mediaPaths: text("media_paths"),
  scheduledAt: text("scheduled_at"),
  status: text("status").notNull(),
});

export const postMetrics = sqliteTable("post_metrics", {
  id: text("id").primaryKey(),
  socialPostId: text("social_post_id").notNull(),
  likes: integer("likes"),
  shares: integer("shares"),
  comments: integer("comments"),
  impressions: integer("impressions"),
  pulledAt: text("pulled_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
