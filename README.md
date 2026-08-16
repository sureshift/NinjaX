# NinjaX

A desktop app for **SEO, GEO (Generative Engine Optimization), AEO (Answer Engine Optimization), and Social Media Management** — runs entirely on your laptop, no server, no account required. Data is stored locally in SQLite.

## Stack

Electron + React + TypeScript, SQLite (better-sqlite3 + Drizzle), Playwright for crawling, node-cron for scheduling. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design.

## Getting started

```bash
npm install
npm run dev
```

This starts the Vite dev server and launches the Electron window pointed at it.

## Building the Windows installer

```bash
npm run dist
```

Produces `release/NinjaX-Setup-<version>.exe` — a standard installer, no dependencies required on the target machine.

## Project structure

- `electron/` — main process: window management, IPC handlers, database, crawler, scheduler
- `src/` — React renderer (the UI)
- `.github/workflows/` — CI (lint/typecheck/test) and Release (builds + publishes the `.exe` on tagged pushes)

## Status

**SEO module: fully built out.** Covers technical SEO, on-page SEO, performance/Core Web Vitals, site architecture, content audits, keyword & rank tracking, off-page/backlinks, and local SEO. See [`electron/modules/seo/`](./electron/modules/seo/) for the source of truth on what's implemented vs. pluggable (rank tracking and backlink data require a licensed third-party API key - see the code comments in `keywords.ts` and `backlinks.ts`).

GEO, AEO, and social modules are still stubbed and ready to be filled in next.

### SEO module coverage

| Area | File | Status |
|---|---|---|
| Technical SEO (crawlability, indexability, robots.txt, sitemap, canonical, structured data, hreflang, HTTPS) | `electron/modules/seo/technical.ts` | Implemented |
| On-page SEO (titles, meta, headings, keyword density, alt text, links, readability) | `electron/modules/seo/onpage.ts` | Implemented |
| Performance / Core Web Vitals (LCP, CLS, INP) | `electron/modules/seo/performance.ts` | Implemented (approximate, cold-load) |
| Site architecture (full crawl, internal link graph, orphan pages, broken links, redirect chains) | `electron/modules/seo/architecture.ts` | Implemented |
| Content SEO (thin content, duplicate titles/meta) | `electron/modules/seo/content.ts` | Implemented |
| Keyword research & rank tracking | `electron/modules/seo/keywords.ts` | Storage + clustering implemented; rank checking needs an API key (pluggable) |
| Off-page / backlinks | `electron/modules/seo/backlinks.ts` | Storage + anchor/toxic analysis implemented; backlink data needs an API key (pluggable) |
| Local SEO (NAP consistency) | `electron/modules/seo/local.ts` | Implemented; Google Business Profile sync is pluggable |
| Competitor intelligence (backlink gap / "link intersect", local listing gap) | `electron/modules/seo/competitors.ts` | Implemented; depends on the same pluggable backlink/listing providers above |

## License

MIT — see [LICENSE](./LICENSE).
