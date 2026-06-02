import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "app.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");
const SEED_PATH = path.join(process.cwd(), "db", "seed.sql");

function initDb(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("foreign_keys = ON");

  // Idempotent: only schema + seed when the sites table is absent.
  const hasSites = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sites'")
    .get();

  if (!hasSites) {
    db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
    db.exec(fs.readFileSync(SEED_PATH, "utf-8"));
  }

  return db;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) _db = initDb();
  return _db;
}
