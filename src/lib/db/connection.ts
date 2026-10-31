import { DATABASE_PATH, NODE_ENV } from '$app/env/private';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const db_path =
	DATABASE_PATH ??
	(NODE_ENV === 'production' ? '/app/data/db/skykit.db' : 'local.db');

// Only open the database at runtime, not during build
let db: DatabaseSync;

export const get_db = () => {
	if (!db) {
		try {
			mkdirSync(dirname(db_path), { recursive: true });
			db = new DatabaseSync(db_path);
			db.exec('PRAGMA busy_timeout = 5000');
			db.exec('PRAGMA journal_mode = WAL');
			db.exec('PRAGMA synchronous = NORMAL');
		} catch (error: unknown) {
			console.error('Failed to open database:', error);
			throw error;
		}
	}
	return db;
};

export const init_db = async () => {
	const client = get_db();

	try {
		client.exec(`
			CREATE TABLE IF NOT EXISTS account_activity (
				did TEXT PRIMARY KEY,
				handle TEXT NOT NULL,
				last_post_date TEXT,
				last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				post_count INTEGER,
				followers_count INTEGER,
				follows_back BOOLEAN DEFAULT FALSE
			)
		`);

		client.exec(`
			CREATE TABLE IF NOT EXISTS stats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				type TEXT NOT NULL,
				value TEXT NOT NULL,
				timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

		client.exec(`
			CREATE INDEX IF NOT EXISTS idx_handle ON account_activity(handle)
		`);

		// Add follows_back column if it doesn't exist (for existing databases)
		try {
			client.exec(`
				ALTER TABLE account_activity ADD COLUMN follows_back BOOLEAN DEFAULT FALSE;
			`);
		} catch {
			// Column might already exist, ignore the error
		}

		// Profile creation date, so cached accounts need no profile fetch
		try {
			client.exec(`
				ALTER TABLE account_activity ADD COLUMN created_at TEXT;
			`);
		} catch {
			// Column might already exist, ignore the error
		}

		// A user's follow list, so repeat runs skip paging getFollows
		client.exec(`
			CREATE TABLE IF NOT EXISTS follow_list_cache (
				did TEXT PRIMARY KEY,
				follows TEXT NOT NULL,
				fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

		console.log('Database initialized successfully');
	} catch (error: unknown) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
};
