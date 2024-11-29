import { NODE_ENV } from '$env/static/private';
import type { Client } from '@libsql/client';
import { createClient } from '@libsql/client';

const db_path =
	NODE_ENV === 'production'
		? 'file:/app/data/db/skykit.db'
		: 'file:local.db';

// Only create the client at runtime, not during build
let db: Client;

export const get_db = () => {
	if (!db) {
		try {
			db = createClient({
				url: db_path,
			});
		} catch (error: unknown) {
			console.error('Failed to create database client:', error);
			throw error;
		}
	}
	return db;
};

export const init_db = async () => {
	const client = get_db();

	try {
		await client.execute(`
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

		await client.execute(`
			CREATE TABLE IF NOT EXISTS stats (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				type TEXT NOT NULL,
				value TEXT NOT NULL,
				timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
			)
		`);

		await client.execute(`
			CREATE INDEX IF NOT EXISTS idx_handle ON account_activity(handle)
		`);

		// Add follows_back column if it doesn't exist (for existing databases)
		try {
			await client.execute(`
				ALTER TABLE account_activity ADD COLUMN follows_back BOOLEAN DEFAULT FALSE;
			`);
		} catch (e: unknown) {
			// Column might already exist, ignore the error
		}

		console.log('Database initialized successfully');
	} catch (error: unknown) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
};
