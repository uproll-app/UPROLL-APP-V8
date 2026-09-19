import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type LocalContent = {
  id: string;
  collection: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

const databasePath = resolve(process.env.LOCAL_DATABASE_PATH || './data/uproll.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id TEXT NOT NULL,
    collection_name TEXT NOT NULL,
    data_json TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (collection_name, id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const contentSelect = database.prepare(`
  SELECT id, collection_name AS collection, data_json, created_at AS createdAt, updated_at AS updatedAt
  FROM content
`);
const contentUpsert = database.prepare(`
  INSERT INTO content (id, collection_name, data_json, created_at, updated_at)
  VALUES (@id, @collection, @dataJson, @createdAt, @updatedAt)
  ON CONFLICT(collection_name, id) DO UPDATE SET
    data_json = excluded.data_json,
    updated_at = excluded.updated_at
`);
const contentDelete = database.prepare('DELETE FROM content WHERE collection_name = ? AND id = ?');

function fromRow(row: Record<string, unknown>): LocalContent {
  return {
    id: String(row.id),
    collection: String(row.collection),
    data: JSON.parse(String(row.data_json)) as Record<string, unknown>,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

export function listContent(collections: string[]): LocalContent[] {
  const rows = contentSelect.all() as Record<string, unknown>[];
  return rows
    .filter((row) => collections.length === 0 || collections.includes(String(row.collection)))
    .map(fromRow)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getContent(collection: string, id: string): LocalContent | null {
  const row = database
    .prepare('SELECT id, collection_name AS collection, data_json, created_at AS createdAt, updated_at AS updatedAt FROM content WHERE collection_name = ? AND id = ?')
    .get(collection, id) as Record<string, unknown> | undefined;
  return row ? fromRow(row) : null;
}

export function upsertContent(collection: string, id: string, data: Record<string, unknown>): LocalContent {
  const now = Date.now();
  const existing = getContent(collection, id);
  const content: LocalContent = {
    id,
    collection,
    data,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  contentUpsert.run({
    id,
    collection,
    dataJson: JSON.stringify(data),
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  });
  return content;
}

export function removeContent(collection: string, id: string): boolean {
  return contentDelete.run(collection, id).changes > 0;
}

export function replaceSetting(key: string, value: unknown): void {
  database.prepare(`
    INSERT INTO settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), Date.now());
}

export function readSetting<T>(key: string, fallback: T): T {
  const row = database.prepare('SELECT value_json FROM settings WHERE key = ?').get(key) as { value_json?: string } | undefined;
  if (!row?.value_json) return fallback;
  return JSON.parse(row.value_json) as T;
}

export function databaseFilePath(): string {
  return databasePath;
}
