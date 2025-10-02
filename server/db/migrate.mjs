import { promises as fs } from "node:fs";
import { join } from "pathe";
import Database from "better-sqlite3";

const defaultPath = join(process.cwd(), "data", "database.sqlite");
const dbPath = process.env.DATABASE_PATH ?? defaultPath;
const migrationsDir = join(process.cwd(), "server", "db", "migrations");

await fs.mkdir(join(process.cwd(), "data"), { recursive: true });

const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  run_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);`);

const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const alreadyRan = db.prepare("SELECT 1 FROM migrations WHERE name = ?").get(file);
  if (alreadyRan) continue;

  const sql = await fs.readFile(join(migrationsDir, file), "utf8");
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/g)
    .map((statement) => statement.trim())
    .filter(Boolean);

  const runMigration = db.transaction(() => {
    for (const statement of statements) {
      db.exec(statement);
    }
    db.prepare("INSERT INTO migrations (name) VALUES (?)").run(file);
  });

  runMigration();
  console.log(`Applied migration ${file}`);
}

db.close();
