import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/boomerang.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      roll_no TEXT UNIQUE NOT NULL,
      college_serial_no TEXT UNIQUE,
      department TEXT,
      year TEXT,
      section TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'student',
      is_active INTEGER DEFAULT 1,
      karma INTEGER DEFAULT 0,
      returns_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      added_by TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('lost','found')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      color TEXT,
      brand TEXT,
      location TEXT NOT NULL,
      landmark TEXT,
      date_lost_found DATETIME,
      status TEXT CHECK(status IN ('open','matched','claimed','returned','closed')) DEFAULT 'open',
      secret_question TEXT,
      secret_answer_hash TEXT,
      images TEXT,
      tags TEXT,
      latitude REAL,
      longitude REAL,
      views INTEGER DEFAULT 0,
      ai_tagged INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      lost_item_id TEXT NOT NULL,
      found_item_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      match_reasons TEXT,
      status TEXT CHECK(status IN ('pending','viewed','accepted','rejected')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lost_item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY(found_item_id) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE(lost_item_id, found_item_id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      claimant_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      answer TEXT,
      status TEXT CHECK(status IN ('pending','approved','rejected','cancelled')) DEFAULT 'pending',
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY(claimant_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(claim_id) REFERENCES claims(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE(user_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_user ON items(user_id);
    CREATE INDEX IF NOT EXISTS idx_claims_item ON claims(item_id);
    CREATE INDEX IF NOT EXISTS idx_claims_claimant ON claims(claimant_id);
    CREATE INDEX IF NOT EXISTS idx_matches_lost ON matches(lost_item_id);
    CREATE INDEX IF NOT EXISTS idx_matches_found ON matches(found_item_id);
  `);
  console.log('Database initialized');
}

export default db;
