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

// Check the schema first so real ALTER failures are not swallowed
function add_column_if_missing(
	client: DatabaseSync,
	table: string,
	column: string,
	definition: string,
) {
	const columns = client
		.prepare(`PRAGMA table_info(${table})`)
		.all()
		.map((row) => row.name);
	if (columns.includes(column)) return;
	client.exec(
		`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
	);
	console.log(`Added column ${table}.${column}`);
}

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

		// Columns added after the table first shipped (for existing databases)
		add_column_if_missing(
			client,
			'account_activity',
			'follows_back',
			'BOOLEAN DEFAULT FALSE',
		);
		// Profile creation date, so cached accounts need no profile fetch
		add_column_if_missing(
			client,
			'account_activity',
			'created_at',
			'TEXT',
		);

		// Whether an account follows a given viewer back. Per viewer, so
		// account_activity.follows_back is no longer read.
		client.exec(`
			CREATE TABLE IF NOT EXISTS follows_back_cache (
				viewer_did TEXT NOT NULL,
				did TEXT NOT NULL,
				follows_back INTEGER NOT NULL,
				checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				PRIMARY KEY (viewer_did, did)
			)
		`);

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
