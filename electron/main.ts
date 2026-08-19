import { app, BrowserWindow } from "electron";
import path from "path";
import { getDb } from "./db/client";
import { registerSeoHandlers } from "./ipc/seo";
import { registerGeoHandlers } from "./ipc/geo";
import { registerAeoHandlers } from "./ipc/aeo";
import { registerSocialHandlers } from "./ipc/social";
import { registerAiHandlers } from "./ipc/ai";
import { registerGoogleHandlers } from "./ipc/google";
import { startScheduler } from "./services/scheduler";
import { restoreAiProviderOnStartup } from "./services/aiSettings";

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "NinjaX",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  // Initialize the local SQLite database (creates file + runs migrations on first launch)
  getDb();

  // Re-activate the user's saved AI provider (online API key or offline local model)
  restoreAiProviderOnStartup();

  // Register all module IPC handlers - renderer talks to these via preload's contextBridge
  registerSeoHandlers();
  registerGeoHandlers();
  registerAeoHandlers();
  registerSocialHandlers();
  registerAiHandlers();
  registerGoogleHandlers();

  // Start recurring jobs: rank checks, scheduled social posts, audits
  startScheduler();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
