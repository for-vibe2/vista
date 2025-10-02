import { app, BrowserWindow, ipcMain } from "electron";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type ProjectRecord = {
  id: string;
  title: string;
  video_path: string | null;
  transcription_id: string | null;
  created_at: string;
  words: string | null;
  config: string | null;
};

type CreateProjectPayload = {
  id?: string;
  title: string;
  videoPath?: string | null;
  transcriptionId?: string | null;
  words?: string | null;
  config?: string | null;
};

let database: Database.Database | null = null;
let databasePath: string | null = null;

const currentDir = path.dirname(fileURLToPath(import.meta.url));

function ensureDirectory(dirPath: string) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function resolvePreload(): string {
  return path.join(currentDir, "preload.js");
}

function resolveIndexFile(): string {
  return path.join(currentDir, "../.output/public/index.html");
}

function initDatabase() {
  if (database) {
    return;
  }

  const userDataPath = process.env.VISTA_SQLITE_PATH ?? path.join(app.getPath("userData"), "storage");
  ensureDirectory(userDataPath);

  databasePath = path.join(userDataPath, "vista.sqlite");

  const instance = new Database(databasePath);
  instance.pragma("journal_mode = WAL");
  instance.exec(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      video_path TEXT,
      transcription_id TEXT,
      created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
      words TEXT,
      config TEXT
    )`
  );

  database = instance;
}

function getDatabase(): Database.Database {
  if (!database) {
    throw new Error("SQLite database is not initialised");
  }
  return database;
}

function registerIpcHandlers() {
  ipcMain.handle("sqlite:ping", () => ({ ready: true, path: databasePath }));

  ipcMain.handle("sqlite:projects:list", () => {
    const rows = getDatabase()
      .prepare<ProjectRecord>(
        `SELECT id, title, video_path, transcription_id, created_at, words, config FROM projects ORDER BY datetime(created_at) DESC`
      )
      .all();
    return rows;
  });

  ipcMain.handle("sqlite:projects:create", (_event, payload: CreateProjectPayload) => {
    const id = payload.id ?? randomUUID();
    const createdAt = new Date().toISOString();

    getDatabase()
      .prepare(
        `INSERT OR REPLACE INTO projects (id, title, video_path, transcription_id, created_at, words, config)
         VALUES (@id, @title, @video_path, @transcription_id, @created_at, @words, @config)`
      )
      .run({
        id,
        title: payload.title,
        video_path: payload.videoPath ?? null,
        transcription_id: payload.transcriptionId ?? null,
        created_at: createdAt,
        words: payload.words ?? null,
        config: payload.config ?? null,
      });

    return { id, created_at: createdAt } satisfies Pick<ProjectRecord, "id" | "created_at">;
  });
}

async function createMainWindow() {
  const browserWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minHeight: 720,
    minWidth: 1024,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: resolvePreload(),
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    await browserWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    browserWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    browserWindow.removeMenu();
    await browserWindow.loadFile(resolveIndexFile());
  }

  browserWindow.once("ready-to-show", () => {
    browserWindow.show();
  });
}

app.whenReady().then(async () => {
  initDatabase();
  registerIpcHandlers();
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (database) {
    database.close();
    database = null;
  }
});

