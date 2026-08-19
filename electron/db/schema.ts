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

// --- Off-page: backlinks (competitorId null = the project's own domain, set = a tracked competitor) ---
export const backlinks = sqliteTable("backlinks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  competitorId: text("competitor_id"),
  sourceUrl: text("source_url").notNull(),
  targetUrl: text("target_url").notNull(),
  anchorText: text("anchor_text"),
  domainAuthority: integer("domain_authority"),
  isToxic: integer("is_toxic", { mode: "boolean" }),
  discoveredAt: text("discovered_at").notNull(),
});

// --- Local SEO: NAP listings (competitorId null = the project's own business, set = a tracked competitor) ---
export const localListings = sqliteTable("local_listings", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  competitorId: text("competitor_id"),
  platform: text("platform").notNull(),
  businessName: text("business_name"),
  address: text("address"),
  phone: text("phone"),
  napConsistent: integer("nap_consistent", { mode: "boolean" }),
  checkedAt: text("checked_at").notNull(),
});

// --- Competitor tracking ---
export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  domain: text("domain").notNull(),
  addedAt: text("added_at").notNull(),
});

// --- AI: generated content, analysis, reports, suggested fixes ---
export const aiGeneratedContent = sqliteTable("ai_generated_content", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  contentType: text("content_type").notNull(),
  topic: text("topic"),
  content: text("content").notNull(),
  generatedAt: text("generated_at").notNull(),
});

export const aiReports = sqliteTable("ai_reports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  title: text("title").notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  generatedAt: text("generated_at").notNull(),
});

export const aiSuggestedFixes = sqliteTable("ai_suggested_fixes", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  issueSource: text("issue_source").notNull(), // 'technical' | 'content' | 'site_crawl'
  issueRefId: text("issue_ref_id"),
  url: text("url").notNull(),
  issueType: text("issue_type").notNull(),
  suggestedFix: text("suggested_fix").notNull(),
  status: text("status").notNull(), // 'pending' | 'applied' | 'dismissed'
  generatedAt: text("generated_at").notNull(),
});

// --- Google integrations: OAuth connections and pulled metrics ---
export const googleConnections = sqliteTable("google_connections", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  service: text("service").notNull(), // 'search_console' | 'analytics' | 'business_profile'
  accountLabel: text("account_label"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  expiryDate: integer("expiry_date"),
  connectedAt: text("connected_at").notNull(),
});

export const searchConsoleMetrics = sqliteTable("search_console_metrics", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  query: text("query"),
  page: text("page"),
  clicks: integer("clicks"),
  impressions: integer("impressions"),
  ctr: real("ctr"),
  position: real("position"),
  date: text("date").notNull(),
});

export const analyticsMetrics = sqliteTable("analytics_metrics", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  date: text("date").notNull(),
  sessions: integer("sessions"),
  activeUsers: integer("active_users"),
  pageViews: integer("page_views"),
  bounceRate: real("bounce_rate"),
  avgSessionDuration: real("avg_session_duration"),
});

export const gbpReviews = sqliteTable("gbp_reviews", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  reviewId: text("review_id").notNull(),
  reviewerName: text("reviewer_name"),
  starRating: integer("star_rating"),
  comment: text("comment"),
  createTime: text("create_time"),
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
