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
  searchVolume: integer("search_volume"),
  difficulty: integer("difficulty"),
  cluster: text("cluster"),
});

// --- Site architecture: one row per crawled page, plus the internal link graph ---
export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  statusCode: integer("status_code"),
  indexable: integer("indexable", { mode: "boolean" }),
  robotsMeta: text("robots_meta"),
  h1Count: integer("h1_count"),
  wordCount: integer("word_count"),
  lastCrawledAt: text("last_crawled_at").notNull(),
});

export const internalLinks = sqliteTable("internal_links", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  sourcePageId: text("source_page_id").notNull(),
  targetUrl: text("target_url").notNull(),
  anchorText: text("anchor_text"),
});

// --- Site-wide crawl issues: broken links, redirect chains, duplicate content ---
export const siteCrawlIssues = sqliteTable("site_crawl_issues", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  issueType: text("issue_type").notNull(),
  severity: text("severity").notNull(),
  details: text("details"),
  detectedAt: text("detected_at").notNull(),
});

// --- Content audits: thin content, duplicate titles/meta, missing content ---
export const contentAudits = sqliteTable("content_audits", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  pageId: text("page_id"),
  issueType: text("issue_type").notNull(),
  severity: text("severity").notNull(),
  details: text("details"),
  detectedAt: text("detected_at").notNull(),
});

// --- Core Web Vitals per page ---
export const coreWebVitals = sqliteTable("core_web_vitals", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  url: text("url").notNull(),
  lcpMs: real("lcp_ms"),
  cls: real("cls"),
  inpMs: real("inp_ms"),
  checkedAt: text("checked_at").notNull(),
});

// --- Off-page: backlinks ---
export const backlinks = sqliteTable("backlinks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  targetUrl: text("target_url").notNull(),
  anchorText: text("anchor_text"),
  domainAuthority: integer("domain_authority"),
  isToxic: integer("is_toxic", { mode: "boolean" }),
  discoveredAt: text("discovered_at").notNull(),
});

// --- Local SEO: NAP listings across directories/platforms ---
export const localListings = sqliteTable("local_listings", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  platform: text("platform").notNull(),
  businessName: text("business_name"),
  address: text("address"),
  phone: text("phone"),
  napConsistent: integer("nap_consistent", { mode: "boolean" }),
  checkedAt: text("checked_at").notNull(),
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
