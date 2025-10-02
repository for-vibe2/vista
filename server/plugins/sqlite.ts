import Database from "better-sqlite3";
import { defineNitroPlugin } from "nitropack";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

declare module "h3" {
  interface H3EventContext {
    sqlite: Database.Database;
  }
}

let connection: Database.Database | undefined;

function getDatabasePath() {
  const configured = process.env.SQLITE_DATABASE_PATH;
  if (configured) {
    return configured;
  }
  return path.join(process.cwd(), ".data", "vista.sqlite");
}

function ensureConnection(): Database.Database {
  if (connection) {
    return connection;
  }

  const targetPath = getDatabasePath();
  const directory = path.dirname(targetPath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  connection = new Database(targetPath);
  connection.pragma("journal_mode = WAL");
  connection.exec(
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

  return connection;
}

export default defineNitroPlugin((nitroApp) => {
  const db = ensureConnection();

  nitroApp.hooks.hook("request", (event) => {
    event.context.sqlite = db;
  });

  nitroApp.hooks.hook("close", () => {
    connection?.close();
    connection = undefined;
  });
});
