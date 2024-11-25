import { NODE_ENV } from '$env/static/private';
import { createClient } from '@libsql/client';

const db_path =
	NODE_ENV === 'production'
		? 'file:/app/data/db/skykit.db'
		: 'file:local.db';

// Only create the client at runtime, not during build
let db: ReturnType<typeof createClient>;

const get_db = () => {
	if (!db) {
		try {
			db = createClient({
				url: db_path,
			});
		} catch (error) {
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
				followers_count INTEGER
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

		console.log('Database initialized successfully');
	} catch (error) {
		console.error('Failed to initialize database:', error);
		throw error;
	}
};

export interface CachedAccount {
	did: string;
	handle: string;
	last_post_date: Date | null;
	last_checked: Date;
	post_count: number | null;
	followers_count: number | null;
}

export const cache_account_activity = async (
	did: string,
	handle: string,
	last_post_date: string | null,
	post_count?: number,
	followers_count?: unknown,
) => {
	const client = get_db();
	await client.execute({
		sql: `
			INSERT OR REPLACE INTO account_activity 
			(did, handle, last_post_date, last_checked, post_count, followers_count) 
			VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
		`,
		args: [
			did,
			handle,
			last_post_date,
			post_count || null,
			typeof followers_count === 'number' ? followers_count : null,
		],
	});
};

export const get_cached_accounts_by_handles = async (
	handles: string[],
): Promise<CachedAccount[]> => {
	if (handles.length === 0) return [];

	const client = get_db();
	const placeholders = handles.map(() => '?').join(',');
	const result = await client.execute({
		sql: `SELECT * FROM account_activity WHERE handle IN (${placeholders})`,
		args: handles,
	});

	return result.rows.map((row) => ({
		did: row.did as string,
		handle: row.handle as string,
		last_post_date: row.last_post_date
			? new Date(row.last_post_date as string)
			: null,
		last_checked: new Date(row.last_checked as string),
		post_count: row.post_count as number | null,
		followers_count: row.followers_count as number | null,
	}));
};

export const store_stat = async (type: string, value: unknown) => {
	const client = get_db();
	await client.execute({
		sql: 'INSERT INTO stats (type, value) VALUES (?, ?)',
		args: [type, JSON.stringify(value)],
	});
};

export { get_db };
