import { NODE_ENV } from '$env/static/private';
import { createClient } from '@libsql/client';

const db_path =
	NODE_ENV === 'production'
		? 'file:/app/data/db/skykit.db'
		: 'file:local.db';

console.log('=====================');
console.log(`db_path: ${db_path}, NODE_ENV: ${NODE_ENV}`);
console.log('=====================');

export const db = createClient({
	url: db_path,
});

export const init_db = async () => {
	await db.execute(`
        CREATE TABLE IF NOT EXISTS account_activity (
            did TEXT PRIMARY KEY,
            handle TEXT NOT NULL,
            last_post_date TEXT,
            last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            post_count INTEGER,
            followers_count INTEGER
        )
    `);

	await db.execute(`
        CREATE TABLE IF NOT EXISTS stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            value TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

	await db.execute(`
        CREATE INDEX IF NOT EXISTS idx_handle ON account_activity(handle)
    `);
};

export const cache_account_activity = async (
	did: string,
	handle: string,
	last_post_date: string | null,
	post_count?: number,
	followers_count?: number,
) => {
	await db.execute({
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
			followers_count || null,
		],
	});
};

export const get_cached_account_activity = async (did: string) => {
	const result = await db.execute({
		sql: 'SELECT * FROM account_activity WHERE did = ?',
		args: [did],
	});

	if (result.rows.length === 0) return null;

	const row = result.rows[0];
	return {
		did: row.did as string,
		handle: row.handle as string,
		last_post_date: row.last_post_date
			? new Date(row.last_post_date as string)
			: null,
		last_checked: new Date(row.last_checked as string),
		post_count: row.post_count as number | null,
		followers_count: row.followers_count as number | null,
	};
};

export const get_cached_accounts_by_handles = async (
	handles: string[],
) => {
	if (handles.length === 0) return [];

	const placeholders = handles.map(() => '?').join(',');
	const result = await db.execute({
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

export const get_stale_accounts = async (max_age_hours: number) => {
	const result = await db.execute({
		sql: `
      SELECT * FROM account_activity 
      WHERE datetime(last_checked) < datetime('now', '-' || ? || ' hours')
        `,
		args: [max_age_hours],
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

export const store_stat = async (type: string, value: any) => {
	await db.execute({
		sql: 'INSERT INTO stats (type, value) VALUES (?, ?)',
		args: [type, JSON.stringify(value)],
	});
};

export const get_stats = async (type: string, limit = 100) => {
	const result = await db.execute({
		sql: 'SELECT value, timestamp FROM stats WHERE type = ? ORDER BY timestamp DESC LIMIT ?',
		args: [type, limit],
	});

	return result.rows.map((row) => ({
		value: JSON.parse(row.value as string),
		timestamp: new Date(row.timestamp as string),
	}));
};
