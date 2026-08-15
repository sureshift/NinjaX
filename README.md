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

Early scaffold. The SEO module has a working crawl → SQLite → UI round trip; GEO, AEO, and social modules are stubbed and ready to be filled in.

## License

MIT — see [LICENSE](./LICENSE).
