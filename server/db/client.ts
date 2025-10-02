import Database from "better-sqlite3";
import { dirname, join } from "pathe";
import { mkdirSync } from "node:fs";

const defaultPath = join(process.cwd(), "data", "database.sqlite");
const dbPath = process.env.DATABASE_PATH ?? defaultPath;

mkdirSync(dirname(dbPath), { recursive: true });

const database = new Database(dbPath);
database.pragma("journal_mode = WAL");

export default database;
