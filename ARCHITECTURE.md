# NinjaX — Architecture

A single-user, offline-capable desktop app for **SEO, GEO (Generative Engine Optimization), AEO (Answer Engine Optimization), and Social Media Management**. Installs on Windows via a `.exe`, stores everything locally in SQLite, and only reaches out to the internet to crawl sites or call external APIs the user has connected.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Shell | **Electron** | Full Node.js access for crawling (Playwright), scheduling, file I/O. Mature `.exe` packaging via electron-builder. |
| UI | **React + TypeScript + Vite** | Fast dev loop, huge component ecosystem, type safety across a large feature set. |
| Styling / components | **Tailwind CSS + shadcn/ui** | Modern, consistent, themeable (light/dark) without a design team. |
| Charts | **Recharts** | Rankings, traffic, engagement trend visualizations. |
| State | **Zustand** (or Redux Toolkit if the team prefers) | Simple global state for cross-module data (active project, sync status). |
| Local DB | **SQLite via better-sqlite3** | Synchronous, embedded, no server — ideal for a laptop-only app. |
| ORM / migrations | **Drizzle ORM** | Type-safe schema, lightweight migrations, works great with better-sqlite3. |
| Crawling | **Playwright** | Technical SEO audits, GEO/AEO content scraping, rendering JS-heavy pages. |
| Job scheduling | **node-cron** (in main process) | Scheduled rank checks, social post publishing, recurring audits. |
| IPC | **Electron `contextBridge` + `ipcMain`/`ipcRenderer`** | Secure bridge between UI and Node backend — renderer never touches Node directly. |
| Packaging | **electron-builder** | Produces signed/unsigned `.exe` (NSIS) for Windows; `.dmg`/`.AppImage` come free later. |
| Auto-update | **electron-updater** | Ships new versions via GitHub Releases. |
| CI/CD | **GitHub Actions** | Builds and publishes the `.exe` on every tagged release. |

---

## 2. High-level architecture

```
┌─────────────────────────────── Desktop App (Electron) ───────────────────────────────┐
│                                                                                        │
│  ┌───────────────────────┐   IPC (contextBridge)   ┌──────────────────────────────┐  │
│  │   Renderer process     │ <---------------------> │        Main process           │  │
│  │   (React + TS UI)      │                          │        (Node.js core)         │  │
│  │                         │                          │                              │  │
│  │  - Dashboard            │                          │  - Module managers           │  │
│  │  - SEO module UI        │                          │  - Job scheduler (cron)      │  │
│  │  - GEO/AEO module UI    │                          │  - Crawler service           │  │
│  │  - Social module UI     │                          │  - API connectors            │  │
│  │  - Reports/exports      │                          │  - SQLite data layer         │  │
│  │  - Settings              │                          │  - Auto-updater              │  │
│  └───────────────────────┘                          └──────────────┬───────────────┘  │
│                                                                     │                  │
│                                                          ┌──────────▼───────────┐      │
│                                                          │   SQLite (local file)  │      │
│                                                          └────────────────────────┘      │
└──────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  External services  │
                              │  - Search Console    │
                              │  - PageSpeed / Lighthouse │
                              │  - Bing/Google search scraping (rank tracking) │
                              │  - LLM answer engines (for GEO/AEO checks) │
                              │  - Social platform APIs (X, LinkedIn, Meta, etc.) │
                              └───────────────────┘
```

**Security boundary:** the renderer (UI) never has direct Node/filesystem access. All crawling, DB writes, and API calls happen in the main process (or isolated utility processes) and are exposed to the UI only through a narrow, typed IPC API defined in `preload.ts`. This keeps the app safe even if it later loads any remote/web content.

---

## 3. Module breakdown (core engine)

Each of the four product areas is a self-contained module in the main process, all sharing the same DB layer and job scheduler:

1. **SEO module**
   - Site crawler (Playwright): broken links, meta tags, headings, page speed, sitemap/robots checks
   - Keyword rank tracker (scheduled checks against search engines)
   - Backlink tracking (via connected 3rd-party APIs, e.g. Ahrefs/Moz/Semrush if the user has a key)
   - Technical SEO audit reports

2. **GEO module (Generative Engine Optimization)**
   - Tracks how the site/brand is represented in AI-generated answers (ChatGPT, Perplexity, Gemini, etc., via API where available)
   - Content structuring recommendations for LLM retrieval (schema, entity clarity, citations)

3. **AEO module (Answer Engine Optimization)**
   - Featured snippet / "position zero" tracking
   - FAQ & structured-data (schema.org) generator and validator
   - Voice-search/answer-box readiness scoring

4. **Social media module**
   - Multi-account connection (OAuth) per platform
   - Content calendar + scheduled publishing
   - Engagement analytics dashboard
   - AI-assisted caption/post drafting (optional, pluggable LLM key)

5. **Shared services**
   - `SchedulerService` — cron jobs for all recurring tasks
   - `CrawlerService` — shared Playwright instance pool
   - `ConnectorService` — manages API keys/OAuth tokens per integration (encrypted at rest)
   - `ReportService` — generates PDF/CSV/HTML exports
   - `NotificationService` — in-app + OS-level notifications for completed jobs/alerts

---

## 4. Data layer (SQLite schema — starting point)

```
projects        (id, name, domain, created_at)
seo_audits      (id, project_id, url, score, issues_json, crawled_at)
keywords        (id, project_id, keyword, target_url, search_engine)
rank_history    (id, keyword_id, position, checked_at)
geo_checks      (id, project_id, query, engine, mentioned, snippet, checked_at)
aeo_snippets    (id, project_id, url, query, has_featured_snippet, checked_at)
social_accounts (id, project_id, platform, handle, oauth_token_encrypted)
social_posts    (id, social_account_id, content, media_paths, scheduled_at, status)
post_metrics    (id, social_post_id, likes, shares, comments, impressions, pulled_at)
settings        (key, value)  -- app-level config, API keys (encrypted)
```

Migrations managed via Drizzle Kit, versioned in the repo so the installer can run them automatically on first launch and on updates.

---

## 5. Suggested folder structure

```
ninjax-desktop/
├── .github/
│   └── workflows/
│       ├── ci.yml              # lint/test/typecheck on every PR
│       └── release.yml         # build + publish .exe on tag push
├── electron/
│   ├── main.ts                 # app entry, window creation
│   ├── preload.ts              # contextBridge IPC surface (typed)
│   ├── ipc/                    # ipcMain handlers, grouped by module
│   │   ├── seo.ts
│   │   ├── geo.ts
│   │   ├── aeo.ts
│   │   └── social.ts
│   ├── services/
│   │   ├── scheduler.ts
│   │   ├── crawler.ts
│   │   ├── connectors/
│   │   └── reports.ts
│   └── db/
│       ├── schema.ts           # Drizzle schema
│       ├── migrations/
│       └── client.ts
├── src/                        # React renderer
│   ├── main.tsx
│   ├── App.tsx
│   ├── modules/
│   │   ├── seo/
│   │   ├── geo/
│   │   ├── aeo/
│   │   └── social/
│   ├── components/ui/          # shadcn components
│   ├── stores/                 # zustand stores
│   └── lib/ipc.ts              # typed wrapper around window.api
├── build/                      # icons, installer assets
├── electron-builder.yml
├── vite.config.ts
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 6. Packaging the `.exe`

`electron-builder.yml`:
```yaml
appId: com.yourcompany.ninjax
productName: NinjaX
directories:
  output: release
win:
  target: nsis
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
publish:
  provider: github
```

`npm run dist` → produces `release/NinjaX-Setup-<version>.exe`, a standard Windows installer anyone can double-click to install — no dependencies, no terminal, no admin knowledge required. `electron-updater` + GitHub Releases gives you auto-update for free after that.

---

## 7. GitHub setup plan

1. Create the repo (public or private — your call) with a clear `README.md`, `LICENSE` (MIT is a sane default for an open desktop tool), and `.gitignore` (Node/Electron template).
2. `.github/workflows/ci.yml` — runs `npm run lint`, `npm run typecheck`, `npm test` on every push/PR.
3. `.github/workflows/release.yml` — on a pushed tag (`v1.0.0`), runs `electron-builder --publish always`, which builds the `.exe` and attaches it directly to a GitHub Release — so "download the app" becomes a single link to the Releases page.
4. Branch strategy: `main` (stable), feature branches → PR → merge. Tag releases with semver (`v0.1.0`, `v1.0.0`, ...).

---

## 8. Suggested build order (MVP → full product)

1. Electron + React shell, IPC scaffolding, SQLite + Drizzle wired up, empty dashboard shell
2. SEO module (crawler + audit report) — proves out the crawling/reporting pipeline
3. AEO module (schema + snippet tracking) — reuses crawler
4. GEO module (LLM-answer checks) — reuses connector pattern
5. Social module (OAuth connectors + scheduler + calendar UI) — heaviest module, do last
6. Reporting/export, settings, auto-update, installer polish

---

*Next step: I can scaffold this repo's actual folder structure and boilerplate code on request, and walk through pushing it to GitHub (I can build the files here; the `git push` itself needs your GitHub credentials/CLI login, since I don't have access to your account).*
